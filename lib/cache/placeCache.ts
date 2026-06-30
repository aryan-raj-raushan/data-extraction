// lib/cache/placeCache.ts
//
// Collection: "place_cache"
// Document shape now tracks PROGRESSIVE fetch state, not just a final array,
// since results accumulate page-by-page across multiple user requests:
//   {
//     _id, cacheKey, mode,
//     queries: string[],        // ordered phrasings to try (see buildQueries)
//     activeQueryIndex: number, // which query we're currently paging through
//     nextPageToken?: string,   // token to fetch the NEXT page of activeQuery
//     data: Place[],            // all unique places collected so far, in order
//     exhausted: boolean,       // true once no query/page has anything left
//     cachedAt: number, updatedAt: Date,
//   }
//
// TTL: 7 days — enforced in application logic.

import { connectToDatabase } from '@/lib/db/mongodb';
import type { LegacyPlace } from '@/lib/places/fetchPlaces';

const COLLECTION = 'place_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type PlaceMode = 'restaurant' | 'school';

export interface PlaceCacheDoc {
  cacheKey: string;
  mode: PlaceMode;
  queries: string[];
  activeQueryIndex: number;
  nextPageToken?: string;
  data: LegacyPlace[];
  exhausted: boolean;
  cachedAt: number;
}

function buildCacheKey(area: string, mode: PlaceMode) {
  return `${mode}::${area.toLowerCase().trim().replace(/\s+/g, '-')}`;
}

// ── read ──────────────────────────────────────────────────────────────────────

export async function readPlaceCacheDoc(
  area: string,
  mode: PlaceMode,
): Promise<PlaceCacheDoc | null> {
  try {
    const { db } = await connectToDatabase();
    const key = buildCacheKey(area, mode);
    const doc = await db.collection(COLLECTION).findOne({ cacheKey: key });

    if (!doc) return null;

    if (Date.now() - doc.cachedAt > CACHE_TTL_MS) {
      await db.collection(COLLECTION).deleteOne({ cacheKey: key });
      console.log(`[🗑️ placeCache] Stale cache deleted for "${key}"`);
      return null;
    }

    console.log(
      `[✅ placeCache] Cache HIT for "${key}" (${doc.data.length} items so far, exhausted=${doc.exhausted})`,
    );
    return doc as unknown as PlaceCacheDoc;
  } catch (err) {
    console.error('[placeCache] read error:', (err as Error).message);
    return null;
  }
}

// ── write (upsert the full progressive state) ────────────────────────────────

export async function writePlaceCacheDoc(area: string, doc: PlaceCacheDoc): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const key = buildCacheKey(area, doc.mode);

    await db.collection(COLLECTION).updateOne(
      { cacheKey: key },
      {
        $set: {
          cacheKey: key,
          mode: doc.mode,
          queries: doc.queries,
          activeQueryIndex: doc.activeQueryIndex,
          nextPageToken: doc.nextPageToken ?? null,
          data: doc.data,
          exhausted: doc.exhausted,
          cachedAt: doc.cachedAt,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(
      `[✅ placeCache] Wrote ${doc.data.length} items for "${key}" (exhausted=${doc.exhausted})`,
    );
  } catch (err) {
    console.error('[placeCache] write error:', (err as Error).message);
  }
}

// ── patch a single place's phone number into an existing cache doc ─────────────

export async function patchPlacePhone(
  area: string,
  mode: PlaceMode,
  placeId: string,
  phone: string,
): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const key = buildCacheKey(area, mode);

    await db.collection(COLLECTION).updateOne(
      { cacheKey: key, 'data.place_id': placeId },
      {
        $set: {
          'data.$.formatted_phone_number': phone,
          updatedAt: new Date(),
        },
      },
    );
    console.log(`[📞 placeCache] Patched phone for place_id="${placeId}" in "${key}"`);
  } catch (err) {
    console.error('[placeCache] patchPhone error:', (err as Error).message);
  }
}
