// app/api/places/route.ts
//
// GET /api/places?area=...&city=...&state=...&mode=restaurant|school
//
// Replaces the old /api/restaurants route.

import { NextRequest, NextResponse } from 'next/server';
import { getPlaces } from '@/lib/places/placeService';
import type { PlaceMode } from '@/lib/cache/placeCache';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const area = searchParams.get('area')?.trim();
  const city = searchParams.get('city')?.trim() || undefined;
  const state = searchParams.get('state')?.trim() || undefined;
  const mode = (searchParams.get('mode')?.trim() || 'restaurant') as PlaceMode;

  if (!area) {
    return NextResponse.json({ error: 'area is required' }, { status: 400 });
  }

  if (mode !== 'restaurant' && mode !== 'school') {
    return NextResponse.json({ error: 'mode must be restaurant or school' }, { status: 400 });
  }

  try {
    const places = await getPlaces(area, city, state, mode);
    return NextResponse.json({ places });
  } catch (err) {
    console.error('[/api/places] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
