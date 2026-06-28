// app/api/places/extract-phone/route.ts
//
// POST /api/places/extract-phone
// Body: { place_id, area, mode }
//
// Fetches phone + opening hours from Google Places Details API,
// then patches the phone number into the MongoDB cache document.

import { NextRequest, NextResponse } from 'next/server';
import { fetchPhoneForPlace } from '@/lib/places/fetchPlaces';
import { patchPlacePhone } from '@/lib/cache/placeCache';
import type { PlaceMode } from '@/lib/cache/placeCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { place_id, area, mode } = body as {
      place_id: string;
      area: string;
      mode: PlaceMode;
    };

    if (!place_id || !area || !mode) {
      return NextResponse.json({ error: 'place_id, area, and mode are required' }, { status: 400 });
    }

    const details = await fetchPhoneForPlace(place_id);
    const phone = details.formatted_phone_number ?? null;

    if (phone) {
      // Persist phone into the MongoDB cache so it's available next time without an API call
      await patchPlacePhone(area, mode, place_id, phone);
    }

    return NextResponse.json({
      place_id,
      formatted_phone_number: phone,
      opening_hours: details.opening_hours ?? null,
    });
  } catch (err) {
    console.error('[/api/places/extract-phone] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
