import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.resolve('constants/cache/restaurants');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getFilePath(key: string) {
  return path.join(CACHE_DIR, `${normalizeKey(key)}.json`);
}

export function readRestaurantCache(key: string): null {
  ensureCacheDir();
  try {
    const filePath = getFilePath(key);
    if (!fs.existsSync(filePath)) return null;

    const { data, cachedAt } = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      console.log(`[🗑️ restaurantCache] Stale cache deleted for "${key}"`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[restaurantCache] read error:', err?.message);
    return null;
  }
}

export function writeRestaurantCache(key: string, data) {
  ensureCacheDir();
  try {
    const filePath = getFilePath(key);
    const unique = Array.isArray(data)
      ? Array.from(new Map(data.map((r) => [r.place_id, r])).values())
      : data;
    fs.writeFileSync(filePath, JSON.stringify({ cachedAt: Date.now(), data: unique }, null, 2));
  } catch (err) {
    console.error('[restaurantCache] write error:', err?.message);
  }
}

export function hasRestaurantCache(key: string): boolean {
  return readRestaurantCache(key) !== null;
}
