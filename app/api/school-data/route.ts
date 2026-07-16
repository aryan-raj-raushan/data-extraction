import { NextRequest, NextResponse } from 'next/server';
import { getSchoolPool } from '@/lib/db/schoolMysqlDb';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/school/school';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();
    const block = searchParams.get('block')?.trim();
    const search = searchParams.get('search')?.trim();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)),
    );

    const pool = getSchoolPool();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (state) {
      conditions.push('state = ?');
      params.push(state);
    }
    if (district) {
      conditions.push('district = ?');
      params.push(district);
    }
    if (block) {
      conditions.push('block = ?');
      params.push(block);
    }
    if (search) {
      conditions.push('school_name LIKE ?');
      params.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id AS _id, udise_code, school_name, state, district, block, village, cluster,
              location, state_mgmt, national_mgmt, school_category, school_type, school_status
       FROM schools
       ${where}
       ORDER BY state, district, school_name
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM schools ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    return NextResponse.json({
      data: rows,
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
