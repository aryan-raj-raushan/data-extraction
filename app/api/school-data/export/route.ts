import { connectToDatabase } from '@/lib/db/schoolMongoDb';
import { EXPORT_ROW_CAP, SCHOOL_COLLECTION, SCHOOL_DB_NAME } from '@/lib/school/school';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();
    const block = searchParams.get('block')?.trim();
    const search = searchParams.get('search')?.trim();

    const filter: Record<string, unknown> = {};
    if (state) filter.state = { $regex: `^\\s*${escapeRegex(state)}\\s*$`, $options: 'i' };
    if (district) filter.district = { $regex: `^\\s*${escapeRegex(district)}\\s*$`, $options: 'i' };
    if (block) filter.block = { $regex: `^\\s*${escapeRegex(block)}\\s*$`, $options: 'i' };
    if (search) filter.school_name = { $regex: escapeRegex(search), $options: 'i' };

    const { db } = await connectToDatabase(SCHOOL_DB_NAME);
    const collection = db.collection(SCHOOL_COLLECTION);

    const total = await collection.countDocuments(filter);
    if (total > EXPORT_ROW_CAP) {
      return NextResponse.json(
        {
          error: `${total.toLocaleString()} rows match these filters — above the ${EXPORT_ROW_CAP.toLocaleString()}-row export cap. Narrow the filters (e.g. pick a district or block) and try again.`,
        },
        { status: 400 },
      );
    }

    // Use the plain (non-streaming) workbook — ExcelJS's streaming writer
    // requires a raw Node.js Writable stream which isn't available in the
    // Next.js App Router edge-compatible runtime. Buffer mode is safe up to
    // the EXPORT_ROW_CAP we already enforce above.
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

    // Bold header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8EAF6' }, // light indigo tint
    };

    const cursor = collection.find(filter).sort({ state: 1, district: 1, school_name: 1 });

    for await (const doc of cursor) {
      sheet.addRow({
        udise_code: doc.udise_code ?? '',
        school_name: doc.school_name ?? '',
        state: doc.state ?? '',
        district: doc.district ?? '',
        block: doc.block ?? '',
        village: doc.village ?? '',
        location: doc.location ?? '',
        state_mgmt: doc.state_mgmt ?? '',
        school_category: doc.school_category ?? '',
        school_type: doc.school_type ?? '',
        school_status: (doc.school_status ?? '').trim(),
      });
    }

    // writeBuffer() returns a Buffer directly — no stream plumbing needed
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
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
