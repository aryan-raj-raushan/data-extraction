// lib/places/fetchPlaces.ts
//
// Uses Places API (New) — POST https://places.googleapis.com/v1/places:searchText.
//
// SAFETY DESIGN — every loop here is bounded in THREE independent ways, so
// nothing can run away even if Google's API behaves unexpectedly:
//   1. Structural bounds: MAX_PAGES_PER_QUERY and NEXT_PAGE_MAX_ATTEMPTS cap
//      how many times any single inner loop can iterate, no matter what.
//   2. Per-request timeout: every fetch() is wrapped in an AbortController
//      with FETCH_TIMEOUT_MS, so a hung/slow connection can't stall forever.
//   3. Global circuit breaker: a single `budget` object (deadline + request
//      counter) is threaded through the whole call tree. The moment either
//      limit is hit, every loop level checks it and bails out immediately,
//      returning whatever was collected so far rather than continuing.
//
// IMPORTANT ONE-TIME SETUP: "Places API (New)" must be enabled separately in
// Google Cloud Console (Project → APIs & Services → Library → "Places API (New)").
// Enabling the legacy "Places API" does NOT automatically enable this one.

import type { PlaceMode } from '@/lib/cache/placeCache';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const TARGET_RESULTS = 100;
const PAGE_SIZE = 20;

const MAX_PAGES_PER_QUERY = 3; // 3 × 20 = 60 per query phrasing
const NEXT_PAGE_DELAY_MS = 1200;
const NEXT_PAGE_MAX_ATTEMPTS = 3;

const FETCH_TIMEOUT_MS = 8_000; // hard cap on any single HTTP call
const GLOBAL_TIME_BUDGET_MS = 45_000; // hard cap on the whole fetchPlaces() run
const MAX_TOTAL_REQUESTS = 25; // hard cap on total HTTP calls across all queries

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

// ── circuit breaker ──────────────────────────────────────────────────────────

interface Budget {
  deadline: number; // Date.now() timestamp past which we must stop
  requestsMade: number;
  maxRequests: number;
}

function newBudget(): Budget {
  return {
    deadline: Date.now() + GLOBAL_TIME_BUDGET_MS,
    requestsMade: 0,
    maxRequests: MAX_TOTAL_REQUESTS,
  };
}

function budgetExceeded(budget: Budget): string | null {
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

// ── price level enum → legacy 0-4 numeric scale (used by PlaceCard's ₹ repeat) ─

const PRICE_LEVEL_MAP: Record<string, number | undefined> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
  PRICE_LEVEL_UNSPECIFIED: undefined,
};

// ── shape returned to the rest of the app (matches the old legacy-API shape) ──

interface LegacyPlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  price_level?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLegacyShape(p: any): LegacyPlace | null {
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

// ── single searchText call ──────────────────────────────────────────────────

async function searchTextPage(
  apiKey: string,
  params: { textQuery: string; pageToken?: string },
  label: string,
  budget: Budget,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ places: any[]; nextPageToken?: string; ok: boolean; stopReason?: string }> {
  const reason = budgetExceeded(budget);
  if (reason) {
    console.error(`[🛑 fetchPlaces:${label}] SAFETY STOP — ${reason}, not issuing request`);
    return { places: [], ok: false, stopReason: reason };
  }

  budget.requestsMade++;

  // The new API requires paging requests to resend the SAME body as the
  // initial request (textQuery + pageSize), just with pageToken added —
  // sending pageToken alone returns INVALID_ARGUMENT "Empty text_query".
  const body = params.pageToken
    ? { textQuery: params.textQuery, pageSize: PAGE_SIZE, pageToken: params.pageToken }
    : { textQuery: params.textQuery, pageSize: PAGE_SIZE };

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
      // Token-not-ready-yet typically surfaces as 400 INVALID_ARGUMENT on a
      // freshly-issued pageToken. Anything else is a real error.
      const errReason = data?.error?.status ?? `HTTP_${res.status}`;
      console.warn(
        `[⏳ fetchPlaces:${label}] ${errReason} — ${data?.error?.message ?? 'retrying'}`,
      );
      return { places: [], ok: false };
    }

    const count = data.places?.length ?? 0;
    console.log(`[✅ fetchPlaces:${label}] results=${count} hasNextPage=${!!data.nextPageToken}`);
    return { places: data.places ?? [], nextPageToken: data.nextPageToken, ok: true };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.warn(
      `[⏳ fetchPlaces:${label}] ${isAbort ? `timed out after ${FETCH_TIMEOUT_MS}ms` : (err as Error).message}`,
    );
    return { places: [], ok: false };
  }
}

// ── follow pageToken up to MAX_PAGES_PER_QUERY times (≤60 results) ──────────

async function searchTextAllPages(
  apiKey: string,
  textQuery: string,
  label: string,
  budget: Budget,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  console.log(`[🔍 fetchPlaces:${label}] → "${textQuery}"`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collected: any[] = [];
  let pageToken: string | undefined;
  let page = 0;

  while (page < MAX_PAGES_PER_QUERY) {
    const stopReason = budgetExceeded(budget);
    if (stopReason) {
      console.error(
        `[🛑 fetchPlaces:${label}] SAFETY STOP before page ${page + 1} — ${stopReason}`,
      );
      break;
    }

    const pageLabel = `${label}-p${page + 1}`;
    let result: {
      places: typeof collected;
      nextPageToken?: string;
      ok: boolean;
      stopReason?: string;
    };
    let attempt = 0;

    while (attempt < NEXT_PAGE_MAX_ATTEMPTS) {
      attempt++;
      if (page > 0) await sleep(NEXT_PAGE_DELAY_MS * attempt);

      const innerStop = budgetExceeded(budget);
      if (innerStop) {
        console.error(`[🛑 fetchPlaces:${pageLabel}] SAFETY STOP mid-retry — ${innerStop}`);
        result = { places: [], ok: false, stopReason: innerStop };
        break;
      }

      result = pageToken
        ? await searchTextPage(apiKey, { textQuery, pageToken }, pageLabel, budget)
        : await searchTextPage(apiKey, { textQuery }, pageLabel, budget);

      if (result.ok || result.stopReason) break;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalResult = result! as any;

    if (!finalResult.ok && pageToken && !finalResult.stopReason) {
      console.error(`[🔴 fetchPlaces:${pageLabel}] gave up after ${attempt} attempts`);
    }

    collected.push(...finalResult.places);

    if (finalResult.stopReason || !finalResult.nextPageToken) break;
    pageToken = finalResult.nextPageToken;
    page++;
  }

  return collected;
}

// ── public API ────────────────────────────────────────────────────────────────

export async function fetchPlaces(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
): Promise<LegacyPlace[]> {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!API_KEY) {
    console.error('[🔴 fetchPlaces] GOOGLE_PLACES_KEY is not set');
    return [];
  }

  const subject = mode === 'school' ? 'best schools' : 'best restaurants';
  const budget = newBudget();
  const startedAt = Date.now();

  console.log(
    `[🟡 fetchPlaces] START mode="${mode}" area="${area}" city="${city ?? '-'}" state="${state ?? '-'}" ` +
      `(budget: ${GLOBAL_TIME_BUDGET_MS / 1000}s / ${MAX_TOTAL_REQUESTS} requests)`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId = new Map<string, any>();
  function addAll(arr: { id: string }[]) {
    for (const r of arr) {
      if (r.id && !byId.has(r.id)) byId.set(r.id, r);
    }
  }

  try {
    let primary = await searchTextAllPages(
      API_KEY,
      `${subject} in ${area}, India`,
      'PRIMARY',
      budget,
    );

    if (primary.length === 0 && city && !budgetExceeded(budget)) {
      primary = await searchTextAllPages(
        API_KEY,
        `${subject} in ${area}, ${city}, India`,
        'FALLBACK-1',
        budget,
      );
    }
    if (primary.length === 0 && state && !budgetExceeded(budget)) {
      primary = await searchTextAllPages(
        API_KEY,
        `${subject} in ${area}, ${state}, India`,
        'FALLBACK-2',
        budget,
      );
    }
    if (primary.length === 0) {
      console.warn(`[🔴 fetchPlaces] ALL FALLBACKS EXHAUSTED for area="${area}"`);
      return [];
    }
    addAll(primary);

    const extraQueries = [
      `top rated ${subject} in ${area}, India`,
      `popular ${subject} near ${area}, India`,
    ];

    for (const q of extraQueries) {
      if (byId.size >= TARGET_RESULTS) break;
      const stopReason = budgetExceeded(budget);
      if (stopReason) {
        console.error(`[🛑 fetchPlaces] SAFETY STOP before topup query — ${stopReason}`);
        break;
      }
      const more = await searchTextAllPages(API_KEY, q, `TOPUP "${q.slice(0, 24)}…"`, budget);
      addAll(more);
    }
  } catch (err) {
    // Belt-and-braces: even an unexpected exception mid-run returns whatever
    // was collected so far instead of throwing the whole request away.
    console.error('[🔴 fetchPlaces] unexpected error, returning partial results:', err);
  }

  const unique = Array.from(byId.values())
    .slice(0, TARGET_RESULTS)
    .map(toLegacyShape)
    .filter((p): p is LegacyPlace => p !== null);

  const elapsed = Date.now() - startedAt;
  console.log(
    `[🏁 fetchPlaces] DONE — ${unique.length} unique results for "${area}" (mode=${mode}) ` +
      `in ${elapsed}ms, ${budget.requestsMade} requests used`,
  );
  return unique;
}

// ── on-demand phone extraction (Places Details — New) ───────────────────────
//
// Single-shot, no pagination involved — but still timeout-guarded so a hung
// connection here can't stall the "Extract Number" button forever either.

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
