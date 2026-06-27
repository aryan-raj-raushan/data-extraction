import { NextRequest, NextResponse } from 'next/server';
import { getRestaurants } from '@/lib/restaurants/restaurantService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get('area');
  const city = searchParams.get('city') || undefined;
  const state = searchParams.get('state') || undefined;

  if (!area) {
    return NextResponse.json({ error: 'area is required' }, { status: 400 });
  }

  try {
    const restaurants = await getRestaurants(area, city, state);
    return NextResponse.json({ restaurants });
  } catch (err) {
    console.error('[/api/restaurants] ERROR:', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Failed to fetch' }, { status: 500 });
  }
}
