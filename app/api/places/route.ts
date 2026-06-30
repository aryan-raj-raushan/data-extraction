// app/api/places/route.ts
//
// GET /api/places?area=...&city=...&state=...&mode=restaurant|school&page=1&pageSize=20
//
// Each call fetches only as many Google pages as needed to satisfy `page`,
// picking up from wherever the cached doc left off. Page 1 of a brand-new
// area hits Google once; clicking to page 2 hits Google once more (or zero
// times if that data already happens to be cached); revisiting any earlier
// page is a pure DB read.

import { NextRequest, NextResponse } from 'next/server';
import { getPlacesPage } from '@/lib/places/placeService';
import type { PlaceMode } from '@/lib/cache/placeCache';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const area = searchParams.get('area')?.trim();
  const city = searchParams.get('city')?.trim() || undefined;
  const state = searchParams.get('state')?.trim() || undefined;
  const mode = (searchParams.get('mode')?.trim() || 'restaurant') as PlaceMode;

  const pageRaw = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(pageSizeRaw, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  if (!area) {
    return NextResponse.json({ error: 'area is required' }, { status: 400 });
  }

  if (mode !== 'restaurant' && mode !== 'school') {
    return NextResponse.json({ error: 'mode must be restaurant or school' }, { status: 400 });
  }

  try {
    const { places, pagination } = await getPlacesPage(area, city, state, mode, page, pageSize);
    return NextResponse.json({ places, pagination });
  } catch (err) {
    console.error('[/api/places] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
