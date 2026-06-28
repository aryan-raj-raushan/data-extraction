// lib/places/fetchPlaces.ts
//
// Replaces fetchRestaurants.ts — handles both 'restaurant' and 'school' mode.
// Phone numbers are NO LONGER fetched eagerly. They are fetched on-demand
// via the "Extract Number" button → POST /api/places/extract-phone.

import type { PlaceMode } from '@/lib/cache/placeCache';

const BASE = 'https://maps.googleapis.com/maps/api/place';

// ── helpers ───────────────────────────────────────────────────────────────────

async function textSearch(
  apiKey: string,
  query: string,
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  console.log(`[🔍 fetchPlaces:${label}] → "${query}"`);
  const url = `${BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`[🔴 fetchPlaces:${label}] HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  const count = data.results?.length ?? 0;
  if (count === 0) {
    console.warn(`[⚠️ fetchPlaces:${label}] status=${data.status} results=0`);
  } else {
    console.log(`[✅ fetchPlaces:${label}] status=${data.status} results=${count}`);
  }
  return data.results ?? [];
}

// ── public API ────────────────────────────────────────────────────────────────

export async function fetchPlaces(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!API_KEY) {
    console.error('[🔴 fetchPlaces] GOOGLE_PLACES_KEY is not set');
    return [];
  }

  const subject = mode === 'school' ? 'best schools' : 'best restaurants';

  console.log(
    `[🟡 fetchPlaces] START mode="${mode}" area="${area}" city="${city ?? '-'}" state="${state ?? '-'}"`,
  );

  let results = await textSearch(API_KEY, `${subject} in ${area}, India`, 'PRIMARY');

  if (results.length === 0 && city) {
    results = await textSearch(API_KEY, `${subject} in ${area}, ${city}, India`, 'FALLBACK-1');
  }

  if (results.length === 0 && state) {
    results = await textSearch(API_KEY, `${subject} in ${area}, ${state}, India`, 'FALLBACK-2');
  }

  if (results.length === 0) {
    console.warn(`[🔴 fetchPlaces] ALL FALLBACKS EXHAUSTED for area="${area}"`);
    return [];
  }

  // Deduplicate by place_id — no cap, phones are fetched lazily on demand
  const unique = Array.from(new Map(results.map((r) => [r.place_id, r])).values());

  console.log(`[🏁 fetchPlaces] DONE — ${unique.length} results for "${area}" (mode=${mode})`);
  return unique;
}

// ── on-demand phone extraction ─────────────────────────────────────────────────

export async function fetchPhoneForPlace(
  placeId: string,
): Promise<{ formatted_phone_number?: string; opening_hours?: object }> {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!API_KEY) return {};

  try {
    const url = `${BASE}/details/json?place_id=${placeId}&fields=formatted_phone_number,opening_hours&key=${API_KEY}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      formatted_phone_number: data.result?.formatted_phone_number,
      opening_hours: data.result?.opening_hours,
    };
  } catch {
    return {};
  }
}
