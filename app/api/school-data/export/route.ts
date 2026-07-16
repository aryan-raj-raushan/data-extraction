import { NextRequest, NextResponse } from 'next/server';
import { getSchoolPool } from '@/lib/db/schoolMysqlDb';
import { EXPORT_ROW_CAP } from '@/lib/school/school';
import ExcelJS from 'exceljs';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();
    const block = searchParams.get('block')?.trim();
    const search = searchParams.get('search')?.trim();

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

    const pool = getSchoolPool();

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM schools ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    if (total > EXPORT_ROW_CAP) {
      return NextResponse.json(
        {
          error: `${total.toLocaleString()} rows match these filters — above the ${EXPORT_ROW_CAP.toLocaleString()}-row export cap. Narrow the filters (e.g. pick a district or block) and try again.`,
        },
        { status: 400 },
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Schools');

    sheet.columns = [
      { header: 'UDISE Code', key: 'udise_code', width: 16 },
      { header: 'School Name', key: 'school_name', width: 40 },
      { header: 'State', key: 'state', width: 22 },
      { header: 'District', key: 'district', width: 20 },
      { header: 'Block', key: 'block', width: 20 },
      { header: 'Village', key: 'village', width: 20 },
      { header: 'Location', key: 'location', width: 14 },
      { header: 'Management', key: 'state_mgmt', width: 26 },
      { header: 'Category', key: 'school_category', width: 26 },
      { header: 'Type', key: 'school_type', width: 18 },
      { header: 'Status', key: 'school_status', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };

    // Pull rows in chunks instead of one giant query — you can now legitimately
    // have up to EXPORT_ROW_CAP rows match, which Mongo's toArray() never saw at this scale
    const CHUNK = 5000;
    for (let offset = 0; offset < total; offset += CHUNK) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT udise_code, school_name, state, district, block, village, location,
                state_mgmt, school_category, school_type, school_status
         FROM schools ${where}
         ORDER BY state, district, school_name
         LIMIT ? OFFSET ?`,
        [...params, CHUNK, offset],
      );
      rows.forEach((doc) => sheet.addRow(doc));
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="school-data-export.xlsx"',
      },
    });
  } catch (err) {
    console.error('[school-data] export GET failed:', err);
    return NextResponse.json({ error: 'Failed to export school data' }, { status: 500 });
  }
}
