// lib/places/placeService.ts
//
// Click-driven pagination: fetches only as many Google pages as needed to
// satisfy the requested page number, picking up exactly where the cache
// doc left off. Revisiting an already-fetched page is a pure DB read.

import { readPlaceCacheDoc, writePlaceCacheDoc, type PlaceCacheDoc } from '@/lib/cache/placeCache';
import {
  buildQueries,
  fetchOnePage,
  newBudget,
  budgetExceeded,
  toLegacyShape,
  PAGE_SIZE,
} from './fetchPlaces';
import type { PlaceMode } from '@/lib/cache/placeCache';
import type { LegacyPlace } from './fetchPlaces';

// Sanity ceiling so a single area can never grow without bound even across
// many user clicks — generous enough that a real user will never hit it.
const MAX_TOTAL_RESULTS = 200;

export interface PlacesPageResult {
  places: LegacyPlace[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number; // how many we've actually fetched so far (may grow on later requests)
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function getPlacesPage(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
  page: number,
  pageSize: number = PAGE_SIZE,
): Promise<PlacesPageResult> {
  const API_KEY = process.env.GOOGLE_PLACES_KEY;

  let doc: PlaceCacheDoc | null = await readPlaceCacheDoc(area, mode);
  if (!doc) {
    doc = {
      cacheKey: '', // filled by writePlaceCacheDoc
      mode,
      queries: buildQueries(area, city, state, mode),
      activeQueryIndex: 0,
      nextPageToken: undefined,
      data: [],
      exhausted: false,
      cachedAt: Date.now(),
    };
  }

  const desiredCount = page * pageSize;

  if (API_KEY && doc.data.length < desiredCount && !doc.exhausted) {
    // Scale the safety budget to how much new work this request actually
    // needs (usually just 1 page) — small for normal clicks, larger for
    // bulk requests like "export everything" (pageSize=100).
    const pagesNeeded = Math.ceil((desiredCount - doc.data.length) / PAGE_SIZE);
    const budget = newBudget(
      Math.min(60_000, 8_000 + pagesNeeded * 10_000),
      Math.min(30, pagesNeeded * 3 + 4),
    );

    const existingIds = new Set(doc.data.map((p) => p.place_id));

    while (doc.data.length < desiredCount && !doc.exhausted && !budgetExceeded(budget)) {
      const query = doc.queries[doc.activeQueryIndex];
      if (query === undefined) {
        doc.exhausted = true;
        break;
      }

      const label = `${doc.activeQueryIndex === 0 ? 'PRIMARY' : `Q${doc.activeQueryIndex}`}-p${
        doc.nextPageToken ? '+' : '1'
      }`;
      const result = await fetchOnePage(API_KEY, query, doc.nextPageToken, label, budget);

      if (!result.ok) {
        // Couldn't get this page after retries — abandon this query
        // (whether it's the first page or a follow-up page) and move on to
        // the next phrasing rather than stalling the whole request.
        doc.nextPageToken = undefined;
        doc.activeQueryIndex++;
        continue;
      }

      for (const raw of result.places) {
        const p = toLegacyShape(raw);
        if (p && !existingIds.has(p.place_id)) {
          doc.data.push(p);
          existingIds.add(p.place_id);
        }
      }

      doc.nextPageToken = result.nextPageToken;
      if (!result.nextPageToken) {
        // This query phrasing has nothing more — move to the next one.
        doc.activeQueryIndex++;
      }
      if (doc.activeQueryIndex >= doc.queries.length && !doc.nextPageToken) {
        doc.exhausted = true;
      }
      if (doc.data.length >= MAX_TOTAL_RESULTS) {
        doc.exhausted = true;
      }
    }

    await writePlaceCacheDoc(area, doc);
  }

  const totalCount = doc.data.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const places = doc.data.slice(start, start + pageSize);

  return {
    places,
    pagination: {
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: safePage < totalPages || (!doc.exhausted && totalCount > 0),
      hasPrevPage: safePage > 1,
    },
  };
}
