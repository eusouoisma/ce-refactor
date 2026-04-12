const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function runMigrations() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migrations ran successfully');
  } finally {
    client.release();
  }
}

// Helper to get current year from settings
async function getCurrentYear() {
  const res = await pool.query(`SELECT value FROM settings WHERE type = 'CurrentYear' LIMIT 1`);
  return res.rows[0]?.value || new Date().getFullYear().toString();
}

// Helper to format date dd/mm/yyyy
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

// Helper to get today in SP timezone
function getTodaySP() {
  const now = new Date();
  // America/Sao_Paulo offset: -3 (or -2 in summer)
  const sp = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
  return sp; // returns YYYY-MM-DD
}

module.exports = { pool, runMigrations, getCurrentYear, formatDate, getTodaySP };
