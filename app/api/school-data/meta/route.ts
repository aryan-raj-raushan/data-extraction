import { NextRequest, NextResponse } from 'next/server';
import { getSchoolPool } from '@/lib/db/schoolMysqlDb';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();

    if (!state) {
      return NextResponse.json({ error: 'state is required' }, { status: 400 });
    }

    const pool = getSchoolPool();

    if (district) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT block FROM schools
         WHERE state = ? AND district = ? AND block IS NOT NULL AND block <> ''
         ORDER BY block`,
        [state, district],
      );
      return NextResponse.json({ blocks: rows.map((r) => r.block) });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT district FROM schools
       WHERE state = ? AND district IS NOT NULL AND district <> ''
       ORDER BY district`,
      [state],
    );
    return NextResponse.json({ districts: rows.map((r) => r.district) });
  } catch (err) {
    console.error('[school-data] meta GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
