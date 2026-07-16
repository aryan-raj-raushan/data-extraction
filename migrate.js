/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

const stripPrefix = (v) => (v || '').toString().trim().replace(/^\d+-/, '').trim();

// Only accept purely numeric strings for numeric columns — anything else becomes null
// instead of crashing the insert (handles corrupted/encoding-garbled values like stray '?')
const toIntOrNull = (v) => {
  const s = (v || '').toString().trim();
  return /^\d+$/.test(s) ? s : null;
};

async function run() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });

  let batch = [];
  const BATCH_SIZE = 1000;
  let total = 0;
  let skipped = 0;

  const toRow = (r) => [
    toIntOrNull(r.serial_no),
    toIntOrNull(r.udise_code),
    r.school_name?.trim() || null,
    r.state?.trim() || null,
    r.district?.trim() || null,
    r.block?.trim() || null,
    r.village?.trim() || null,
    r.cluster?.trim() || null,
    stripPrefix(r.location),
    stripPrefix(r.state_mgmt),
    stripPrefix(r.national_mgmt),
    stripPrefix(r.school_category),
    stripPrefix(r.school_type),
    stripPrefix(r.school_status),
  ];

  const SQL = `INSERT IGNORE INTO schools
       (serial_no, udise_code, school_name, state, district, block, village, cluster,
        location, state_mgmt, national_mgmt, school_category, school_type, school_status)
       VALUES ?`;

  const insertBatch = async (rows) => {
    if (!rows.length) return;
    try {
      await pool.query(SQL, [rows.map(toRow)]);
      total += rows.length;
      console.log(`Inserted ${total} rows so far... (${skipped} skipped)`);
    } catch (err) {
      // A bad value somewhere in this batch — fall back to one-by-one so we only lose that row
      console.error(`Batch failed (${err.message}), retrying rows individually...`);
      for (const r of rows) {
        try {
          await pool.query(SQL, [[toRow(r)]]);
          total++;
        } catch (rowErr) {
          skipped++;
          console.error(
            `  Skipped row — udise_code=${r.udise_code}, name=${r.school_name}: ${rowErr.message}`,
          );
        }
      }
      console.log(`Inserted ${total} rows so far... (${skipped} skipped)`);
    }
  };

  await new Promise((resolve, reject) => {
    fs.createReadStream('./schools.csv')
      .pipe(csv())
      .on('data', function (row) {
        batch.push(row);
        if (batch.length >= BATCH_SIZE) {
          this.pause();
          insertBatch(batch)
            .then(() => {
              batch = [];
              this.resume();
            })
            .catch(reject);
        }
      })
      .on('end', async () => {
        await insertBatch(batch);
        resolve();
      })
      .on('error', reject);
  });

  console.log(`Done. Total inserted: ${total}, skipped: ${skipped}`);
  await pool.end();
}

run().catch(console.error);
