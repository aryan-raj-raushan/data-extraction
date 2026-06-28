// lib/cache/placeCache.ts
//
// Replaces the old file-based restaurantCache.ts
// Collection: "place_cache"
// Document shape:
//   { _id, cacheKey, mode, data: Place[], cachedAt: number, updatedAt: Date }
//
// TTL: 7 days — enforced in application logic (MongoDB TTL index optional).

import { connectToDatabase } from '@/lib/db/mongodb';

const COLLECTION = 'place_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type PlaceMode = 'restaurant' | 'school';

function buildCacheKey(area: string, mode: PlaceMode) {
  return `${mode}::${area.toLowerCase().trim().replace(/\s+/g, '-')}`;
}

// ── read ──────────────────────────────────────────────────────────────────────

export async function readPlaceCache(
  area: string,
  mode: PlaceMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> {
  try {
    const { db } = await connectToDatabase();
    const key = buildCacheKey(area, mode);
    const doc = await db.collection(COLLECTION).findOne({ cacheKey: key });

    if (!doc) return null;

    // Evict stale cache
    if (Date.now() - doc.cachedAt > CACHE_TTL_MS) {
      await db.collection(COLLECTION).deleteOne({ cacheKey: key });
      console.log(`[🗑️ placeCache] Stale cache deleted for "${key}"`);
      return null;
    }

    console.log(`[✅ placeCache] Cache HIT for "${key}" (${doc.data.length} items)`);
    return doc.data;
  } catch (err) {
    console.error('[placeCache] read error:', (err as Error).message);
    return null;
  }
}

// ── write ─────────────────────────────────────────────────────────────────────

export async function writePlaceCache(
  area: string,
  mode: PlaceMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const key = buildCacheKey(area, mode);

    // Deduplicate by place_id
    const unique = Array.from(new Map(data.map((r) => [r.place_id, r])).values());

    await db.collection(COLLECTION).updateOne(
      { cacheKey: key },
      {
        $set: {
          cacheKey: key,
          mode,
          data: unique,
          cachedAt: Date.now(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(`[✅ placeCache] Wrote ${unique.length} items for "${key}"`);
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

    // Update the phone field of the matching element inside the data array
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
