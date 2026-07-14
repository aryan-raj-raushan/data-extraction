import { NextRequest, NextResponse } from 'next/server';
import { SCHOOL_COLLECTION, SCHOOL_DB_NAME } from '@/lib/school/school';
import { connectToDatabase } from '@/lib/db/schoolMongoDb';

// Returns distinct districts for a state, or distinct blocks for a
// state+district — sourced live from Mongo so dropdown options always
// match real values exactly (see note above on why this beats a static
// generic cities.json for this particular field).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();

    if (!state) {
      return NextResponse.json({ error: 'state is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase(SCHOOL_DB_NAME);
    const collection = db.collection(SCHOOL_COLLECTION);
    const stateMatch = { $regex: `^\\s*${state}\\s*$`, $options: 'i' };

    if (district) {
      const blocks = await collection.distinct('block', {
        state: stateMatch,
        district: { $regex: `^\\s*${district}\\s*$`, $options: 'i' },
      });
      return NextResponse.json({ blocks: blocks.filter(Boolean).sort() });
    }

    const districts = await collection.distinct('district', { state: stateMatch });
    return NextResponse.json({ districts: districts.filter(Boolean).sort() });
  } catch (err) {
    console.error('[school-data] meta GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
