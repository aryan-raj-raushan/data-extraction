// app/api/places/route.ts
//
// GET /api/places?area=...&city=...&state=...&mode=restaurant|school&page=1&pageSize=20
//
// On first call for a given area/mode, getPlaces() fetches up to ~100 results
// from Google (looping next_page_token) and stores ALL of them in Mongo.
// Every call — including this one — then just slices that stored array.
// So page 2, 3, 4... never touch Google again; they're instant DB reads.

import { NextRequest, NextResponse } from 'next/server';
import { getPlaces } from '@/lib/places/placeService';
import type { PlaceMode } from '@/lib/cache/placeCache';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

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
    // Full set (up to ~100), fetched from Google only on cache miss.
    const allPlaces = await getPlaces(area, city, state, mode);

    const totalCount = allPlaces.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);

    const start = (safePage - 1) * pageSize;
    const places = allPlaces.slice(start, start + pageSize);

    return NextResponse.json({
      places,
      pagination: {
        page: safePage,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    });
  } catch (err) {
    console.error('[/api/places] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
