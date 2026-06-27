import {
  readRestaurantCache,
  writeRestaurantCache,
  hasRestaurantCache,
} from '@/lib/cache/restaurantCache';
import { fetchRestaurants } from './fetchRestaurants';

export async function getRestaurants(area: string, city?: string, state?: string) {
  // Cache key: area (unique enough since areas are tied to their city)
  const cacheKey = area;

  if (hasRestaurantCache(cacheKey)) {
    return readRestaurantCache(cacheKey);
  }

  const restaurants = await fetchRestaurants(area, city, state);

  if (restaurants.length > 0) {
    writeRestaurantCache(cacheKey, restaurants);
  }

  return restaurants;
}
