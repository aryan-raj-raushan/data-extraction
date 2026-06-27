export async function fetchRestaurants(area: string, city?: string, state?: string) {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;

  if (!API_KEY) {
    console.error('[🔴 fetchRestaurants] GOOGLE_PLACES_KEY is not set');
    return [];
  }

  const BASE = 'https://maps.googleapis.com/maps/api/place';

  async function textSearch(q: string, label: string) {
    console.log(`[🔍 fetchRestaurants:${label}] Calling API → "${q}"`);
    const url = `${BASE}/textsearch/json?query=${encodeURIComponent(q)}&key=${API_KEY}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`[🔴 fetchRestaurants:${label}] HTTP ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    const count = data.results?.length ?? 0;
    if (count > 0) {
      console.log(`[✅ fetchRestaurants:${label}] status=${data.status} results=${count}`);
    } else {
      console.warn(
        `[⚠️ fetchRestaurants:${label}] status=${data.status} results=0 → will try fallback`,
      );
    }
    return data.results ?? [];
  }

  async function enrichWithDetails(
    placeId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ formatted_phone_number?: string; opening_hours?: any }> {
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

  console.log(
    `[🟡 fetchRestaurants] START area="${area}" city="${city ?? '-'}" state="${state ?? '-'}"`,
  );
  let results = await textSearch(
    `best restaurants with number in ${area}, India`,
    'PRIMARY:with-number',
  );

  if (results.length === 0) {
    console.log('[🔁 fetchRestaurants] FALLBACK-1 → dropping "with number"');
    results = await textSearch(`best restaurants in ${area}, India`, 'FALLBACK-1:plain');
  }

  if (results.length === 0 && city) {
    console.log(`[🔁 fetchRestaurants] FALLBACK-2 → adding city="${city}"`);
    results = await textSearch(
      `best restaurants in ${area}, ${city}, India`,
      'FALLBACK-2:with-city',
    );
  }

  if (results.length === 0 && state) {
    console.log(`[🔁 fetchRestaurants] FALLBACK-3 → adding state="${state}"`);
    results = await textSearch(
      `best restaurants in ${area}, ${state}, India`,
      'FALLBACK-3:with-state',
    );
  }

  if (results.length === 0) {
    console.warn(`[🔴 fetchRestaurants] ALL FALLBACKS EXHAUSTED — no results for area="${area}"`);
    return [];
  }

  // Deduplicate → take only first 10
  const unique = Array.from(new Map(results.map((r) => [r.place_id, r])).values()).slice(0, 10);

  console.log(`[📞 fetchRestaurants] Fetching details for ${unique.length} places (max 10)...`);
  const enriched = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unique.map(async (r: any) => {
      const details = await enrichWithDetails(r.place_id);
      return { ...r, ...details };
    }),
  );

  console.log(
    `[🏁 fetchRestaurants] DONE — returning ${enriched.length} enriched results for area="${area}"`,
  );
  return enriched;
}
