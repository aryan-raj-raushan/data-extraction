// lib/places/fetchPlaces.ts
//
// Places API (New) — single-page, click-driven fetching.
// Instead of bulk-prefetching ~100 results upfront, we fetch ONE page (20
// results) at a time, exactly when the caller needs it. placeService.ts
// drives this: it fetches just enough pages to satisfy the requested page
// number, accumulating into the DB doc across requests. Revisiting an
// already-fetched page is an instant DB read; only new territory hits Google.

import type { PlaceMode } from '@/lib/cache/placeCache';

export const PAGE_SIZE = 20;

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FETCH_TIMEOUT_MS = 8_000;
const NEXT_PAGE_RETRY_DELAY_MS = 1200;
const MAX_ATTEMPTS_PER_PAGE = 3;

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.currentOpeningHours.openNow',
  'nextPageToken',
].join(',');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── circuit breaker (scoped to a single caller-defined budget) ─────────────

export interface Budget {
  deadline: number;
  requestsMade: number;
  maxRequests: number;
}

export function newBudget(timeBudgetMs: number, maxRequests: number): Budget {
  return { deadline: Date.now() + timeBudgetMs, requestsMade: 0, maxRequests };
}

export function budgetExceeded(budget: Budget): string | null {
  if (Date.now() >= budget.deadline) return 'time budget exceeded';
  if (budget.requestsMade >= budget.maxRequests) return 'request budget exceeded';
  return null;
}

// ── fetch with hard timeout ──────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── price level enum → legacy 0-4 numeric scale ─────────────────────────────

const PRICE_LEVEL_MAP: Record<string, number | undefined> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
  PRICE_LEVEL_UNSPECIFIED: undefined,
};

export interface LegacyPlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  price_level?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toLegacyShape(p: any): LegacyPlace | null {
  if (!p?.id) return null;
  return {
    place_id: p.id,
    name: p.displayName?.text ?? '',
    formatted_address: p.formattedAddress,
    rating: p.rating,
    user_ratings_total: p.userRatingCount,
    opening_hours:
      p.currentOpeningHours?.openNow !== undefined
        ? { open_now: p.currentOpeningHours.openNow }
        : undefined,
    price_level: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
  };
}

// ── single page fetch, with retry only for "token not ready yet" ───────────
//
// IMPORTANT: paging requests must resend the SAME textQuery + pageSize as
// the initial request, with pageToken added — sending pageToken alone
// returns INVALID_ARGUMENT "Empty text_query".

export async function fetchOnePage(
  apiKey: string,
  textQuery: string,
  pageToken: string | undefined,
  label: string,
  budget: Budget,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ places: any[]; nextPageToken?: string; ok: boolean }> {
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS_PER_PAGE) {
    attempt++;

    const stop = budgetExceeded(budget);
    if (stop) {
      console.error(`[🛑 fetchPlaces:${label}] SAFETY STOP — ${stop}`);
      return { places: [], ok: false };
    }

    if (pageToken && attempt > 1) await sleep(NEXT_PAGE_RETRY_DELAY_MS * attempt);

    budget.requestsMade++;
    const body = pageToken
      ? { textQuery, pageSize: PAGE_SIZE, pageToken }
      : { textQuery, pageSize: PAGE_SIZE };

    try {
      const res = await fetchWithTimeout(
        SEARCH_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
          },
          body: JSON.stringify(body),
          cache: 'no-store',
        },
        FETCH_TIMEOUT_MS,
      );
      const data = await res.json();

      if (!res.ok) {
        const reason = data?.error?.status ?? `HTTP_${res.status}`;
        console.warn(`[⏳ fetchPlaces:${label}] ${reason} — ${data?.error?.message ?? 'retrying'}`);
        continue;
      }

      const count = data.places?.length ?? 0;
      console.log(`[✅ fetchPlaces:${label}] results=${count} hasNextPage=${!!data.nextPageToken}`);
      return { places: data.places ?? [], nextPageToken: data.nextPageToken, ok: true };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      console.warn(
        `[⏳ fetchPlaces:${label}] ${isAbort ? `timed out after ${FETCH_TIMEOUT_MS}ms` : (err as Error).message}`,
      );
    }
  }

  console.error(`[🔴 fetchPlaces:${label}] gave up after ${attempt} attempts`);
  return { places: [], ok: false };
}

// ── ordered list of query phrasings to try for an area ──────────────────────
//
// placeService walks this list in order: page through query[0] until it's
// exhausted (no more nextPageToken), then move to query[1], etc. This is
// what lets us go past Google's ~60-result-per-phrasing ceiling without
// fetching variety we don't need yet.

export function buildQueries(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
): string[] {
  const subject = mode === 'school' ? 'best schools' : 'best restaurants';
  const queries = [`${subject} in ${area}, India`];
  if (city) queries.push(`${subject} in ${area}, ${city}, India`);
  if (state) queries.push(`${subject} in ${area}, ${state}, India`);
  queries.push(`top rated ${subject} in ${area}, India`);
  queries.push(`popular ${subject} near ${area}, India`);
  return queries;
}

// ── on-demand phone extraction (Places Details — New) ───────────────────────

export async function fetchPhoneForPlace(
  placeId: string,
): Promise<{ formatted_phone_number?: string; opening_hours?: { open_now?: boolean } }> {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!API_KEY) return {};

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask':
            'nationalPhoneNumber,internationalPhoneNumber,currentOpeningHours.openNow',
        },
        cache: 'no-store',
      },
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      formatted_phone_number: data.nationalPhoneNumber ?? data.internationalPhoneNumber,
      opening_hours:
        data.currentOpeningHours?.openNow !== undefined
          ? { open_now: data.currentOpeningHours.openNow }
          : undefined,
    };
  } catch {
    return {};
  }
}
