const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function shouldUseSSL() {
  if (process.env.PGSSL === 'false') return false;
  if (process.env.PGSSL === 'true') return true;
  if (process.env.NODE_ENV === 'production') return true;
  const url = process.env.DATABASE_URL || '';
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  return /sslmode=require/i.test(url) || url.includes('railway') || url.includes('amazonaws');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL() ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('[migrations] no migrations directory, skipping');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('[migrations] no .sql files found, skipping');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = new Set(
      (await client.query('SELECT name FROM _migrations')).rows.map(r => r.name)
    );

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrations] applying ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`[migrations] ${file} failed: ${err.message}`);
      }
    }

    if (count === 0) {
      console.log('[migrations] up to date, nothing new to apply');
    } else {
      console.log(`[migrations] applied ${count} new migration(s)`);
    }
  } finally {
    client.release();
  }
}

async function getCurrentYear() {
  const res = await pool.query(`SELECT value FROM settings WHERE LOWER(type) = 'currentyear' LIMIT 1`);
  return res.rows[0]?.value || new Date().getFullYear().toString();
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function getTodaySP() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
}

module.exports = { pool, runMigrations, getCurrentYear, formatDate, getTodaySP };
