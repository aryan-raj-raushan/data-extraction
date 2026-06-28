// lib/places/placeService.ts
//
// Replaces restaurantService.ts
// Checks MongoDB cache first; falls back to Google Places API.

import { readPlaceCache, writePlaceCache } from '@/lib/cache/placeCache';
import { fetchPlaces } from './fetchPlaces';
import type { PlaceMode } from '@/lib/cache/placeCache';

export async function getPlaces(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // 1. Try DB cache
  const cached = await readPlaceCache(area, mode);
  if (cached) return cached;

  // 2. Fetch from Google Places API
  const places = await fetchPlaces(area, city, state, mode);

  // 3. Persist to DB if we got results
  if (places.length > 0) {
    await writePlaceCache(area, mode, places);
  }

  return places;
}
