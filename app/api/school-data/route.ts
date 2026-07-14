import { NextRequest, NextResponse } from 'next/server';

import {
  SCHOOL_DB_NAME,
  SCHOOL_COLLECTION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/school/school';
import { connectToDatabase } from '@/lib/db/schoolMongoDb';

// Escapes regex special characters so user input can't break the query
// (or be used for a ReDoS-style pattern).
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim(); // "city" filter
    const block = searchParams.get('block')?.trim();
    const search = searchParams.get('search')?.trim();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)),
    );

    const { db } = await connectToDatabase(SCHOOL_DB_NAME);
    const collection = db.collection(SCHOOL_COLLECTION);

    // Case-insensitive, whitespace-tolerant matches — your sample doc has
    // fields like school_status: " 0-Operational" with stray whitespace,
    // so exact equality would silently drop matches.
    const filter: Record<string, unknown> = {};
    if (state) filter.state = { $regex: `^\\s*${escapeRegex(state)}\\s*$`, $options: 'i' };
    if (district) filter.district = { $regex: `^\\s*${escapeRegex(district)}\\s*$`, $options: 'i' };
    if (block) filter.block = { $regex: `^\\s*${escapeRegex(block)}\\s*$`, $options: 'i' };
    if (search) filter.school_name = { $regex: escapeRegex(search), $options: 'i' };

    const [data, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ state: 1, district: 1, school_name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[school-data] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch school data' }, { status: 500 });
  }
}
