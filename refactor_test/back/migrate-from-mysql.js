#!/usr/bin/env node
/**
 * Migration script: MySQL dump (banco.sql) → PostgreSQL (sistema_ce)
 *
 * Run from refactor_test/back/:
 *   node migrate-from-mysql.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Pool } = require('pg');
require('dotenv').config();

const DUMP_PATH = path.resolve(__dirname, '../../banco.sql');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Type converters ──────────────────────────────────────────────────────────

function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function toInt(v) {
  if (v === null || v === '') return 0;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function toDecimal(v) {
  if (v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function toSmallInt(v) {
  if (v === null) return 0;
  return parseInt(v, 10) ? 1 : 0;
}

// Returns null for 0 (not a valid FK), otherwise the integer
function toFKId(v) {
  const n = toInt(v);
  return n === 0 ? null : n;
}

// Converts MySQL date string to PostgreSQL DATE or null (or fallback if provided)
function toDate(v, fallback = null) {
  if (!v || v === '0000-00-00' || v === '') return fallback;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return fallback;
  const d = new Date(s.slice(0, 10));
  if (isNaN(d.getTime())) return fallback;
  return s.slice(0, 10);
}

// Converts MySQL datetime string to PostgreSQL TIMESTAMP or null
function toTimestamp(v) {
  if (!v || v === '0000-00-00 00:00:00' || v === '') return null;
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return null;
  return v;
}

// PHP uses $2y$, Node bcryptjs needs $2b$ — functionally identical
function fixPasswordHash(hash) {
  if (!hash) return hash;
  return hash.replace(/^\$2y\$/, '$2b$');
}

// ─── Row transformers per table ───────────────────────────────────────────────
// Each transformer receives (values: any[], columns: string[]) and returns
// the object to insert, mapped to the NEW PostgreSQL column names.

const TABLES = {

  users: {
    pgTable: 'users',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:          toInt(g('id')),
        username:    toStr(g('username')),
        name:        toStr(g('name')),
        permissions: toStr(g('permissions')),
        password:    fixPasswordHash(toStr(g('password'))),
        deleted:     toSmallInt(g('deleted')),
      };
    },
  },

  settings: {
    pgTable: 'settings',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:    toInt(g('id')),
        type:  toStr(g('type')),
        value: toStr(g('value')),
        year:  toStr(g('year')),
      };
    },
  },

  product: {
    pgTable: 'product',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:       toInt(g('id')),
        type:     toStr(g('type')),
        category: toStr(g('category')) || 'atividade',
        name:     toStr(g('name')),
        duration: toStr(g('duration')),
      };
    },
  },

  variant: {
    pgTable: 'variant',
    fkFilters: [{ col: 'productId', parentTable: 'product' }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:                      toInt(g('id')),
        productId:               toInt(g('productId')),
        pricingType:             toStr(g('pricingType')),
        priceAdult:              toDecimal(g('priceAdult')),
        priceHalf:               toDecimal(g('priceHalf')),
        priceNet:                toDecimal(g('priceNet')),
        priceBrazilian:          toDecimal(g('priceBrazilian')),
        priceFree:               toDecimal(g('priceFree')),
        priceGroup:              toDecimal(g('priceGroup')),
        paxLimit:                toInt(g('paxLimit')),
        priceAdultHighSeason:    toDecimal(g('priceAdultHighSeason')),
        priceHalfHighSeason:     toDecimal(g('priceHalfHighSeason')),
        priceNetHighSeason:      toDecimal(g('priceNetHighSeason')),
        priceFreeHighSeason:     toDecimal(g('priceFreeHighSeason')),
        priceBrazilianHighSeason:toDecimal(g('priceBrazilianHighSeason')),
        priceGroupHighSeason:    toDecimal(g('priceGroupHighSeason')),
      };
    },
  },

  customers: {
    pgTable: 'customers',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:           toInt(g('id')),
        customerName: toStr(g('customerName')),
        customerType: toStr(g('customerType')),
        createdBy:    toStr(g('createdBy')),
        lastEditBy:   toStr(g('lastEditBy')),
      };
    },
  },

  customerContacts: {
    pgTable: 'customerContacts',
    fkFilters: [{ col: 'customerId', parentTable: 'customers' }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:             toInt(g('id')),
        customerId:     toInt(g('customerId')),
        contactName:    toStr(g('contactName')),
        contactContact: toStr(g('contactContact')),
        contactOffice:  toStr(g('contactOffice')),
        contactEmail:   toStr(g('contactEmail')),
        createdBy:      toStr(g('createdBy')),
        lastEditBy:     toStr(g('lastEditBy')),
        deleted:        toSmallInt(g('deleted')),
      };
    },
  },

  dayOrder: {
    pgTable: 'dayOrder',
    // fkFilters: [{col, parentTable}] — rows with invalid parent IDs are skipped
    fkFilters: [{ col: 'originalDayOrder', parentTable: 'dayOrder', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:              toInt(g('id')),
        date:            toDate(g('date'), '1970-01-01'), // NOT NULL in schema
        name:            toStr(g('name')),
        weekDay:         toStr(g('weekDay')),
        comments:        toStr(g('comments')),
        passed:          toSmallInt(g('passed')),
        autoInserted:    toSmallInt(g('autoInserted')),
        originalDayOrder:toFKId(g('originalDayOrder')),
        lastEditBy:      toStr(g('lastEditBy')),
      };
    },
  },

  dayOrderEmployee: {
    pgTable: 'dayOrderEmployee',
    fkFilters: [{ col: 'dayOrderId', parentTable: 'dayOrder', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:         toInt(g('id')),
        dayOrderId: toFKId(g('dayOrderId')),
        function:   toStr(g('function')),
        name:       toStr(g('name')),
        prevision:  toStr(g('prevision')),
        arrival:    toStr(g('arrival')),
        departure:  toStr(g('departure')),
        phone:      toStr(g('phone')),
        comments:   toStr(g('comments')),
        deleted:    toSmallInt(g('deleted')),
      };
    },
  },

  dayOrderAssociateGuidesInTours: {
    pgTable: 'dayOrderAssociateGuidesInTours',
    fkFilters: [{ col: 'dayOrderId', parentTable: 'dayOrder', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:         toInt(g('id')),
        dayOrderId: toFKId(g('dayOrderId')),
        tourHour:   toStr(g('tourHour')),
        activity:   toStr(g('activity')),
        language:   toStr(g('language')),
        guide:      toStr(g('guide')),
      };
    },
  },

  dayOrderEmployeesFunctions: {
    pgTable: 'dayOrderEmployeesFunctions',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:          toInt(g('id')),
        name:        toStr(g('name')),
        orderNumber: toInt(g('orderNumber')),
      };
    },
  },

  dayOrderEmployeesList: {
    pgTable: 'dayOrderEmployeesList',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:       toInt(g('id')),
        name:     toStr(g('name')),
        function: toStr(g('function')),
        phone:    toStr(g('phone')),
        type:     toStr(g('type')),
      };
    },
  },

  dayOrderEmployeesRemunerations: {
    pgTable: 'dayOrderEmployeesRemunerations',
    fkFilters: [{ col: 'functionId', parentTable: 'dayOrderEmployeesFunctions', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:           toInt(g('id')),
        functionId:   toFKId(g('functionId')),
        paymentType:  toStr(g('paymentType')),
        activity:     toStr(g('activity')),
        hourlyValue1: toDecimal(g('hourlyValue1')),
        hourlyValue2: toDecimal(g('hourlyValue2')),
        hourlyValue3: toDecimal(g('hourlyValue3')),
      };
    },
  },

  dayOrderPayments: {
    pgTable: 'dayOrderPayments',
    fkFilters: [{ col: 'dayOrderId', parentTable: 'dayOrder', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:           toInt(g('id')),
        dayOrderId:   toFKId(g('dayOrderId')),
        function:     toStr(g('function')),
        employeeName: toStr(g('employeeName')),
        arrival:      toStr(g('arrival')),
        departure:    toStr(g('departure')),
        value:        toDecimal(g('value')),
        comments:     toStr(g('comments')),
        activity:     toStr(g('activity')),
        tourHour:     toStr(g('tourHour')),
        paymentDate:  toTimestamp(toDate(g('paymentDate'))),
      };
    },
  },

  tokens: {
    pgTable: 'tokens',
    fkFilters: [{ col: 'userId', parentTable: 'users' }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:           toInt(g('id')),
        userId:       toFKId(g('userId')),
        token:        toStr(g('token')),
        creationDate: toTimestamp(g('creationDate')),
      };
    },
  },

  numberOfGroups: {
    pgTable: 'numberOfGroups',
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:       toInt(g('id')),
        date:     toDate(g('date')),
        hour:     toStr(g('hour')),
        activity: toStr(g('activity')),
        groups:   toInt(g('groups')),
      };
    },
  },

  tour: {
    pgTable: 'tour',
    fkFilters: [{ col: 'dayOrderId', parentTable: 'dayOrder', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      // dayOrderId: 0 → NULL (not linked to a day order)
      const dayOrderId = toFKId(g('dayOrderId'));
      return {
        id:                 toInt(g('id')),
        type:               toStr(g('type')),
        orderRef:           toStr(g('orderRef')),
        platform:           toStr(g('platform')),
        activity:           toStr(g('activity')),
        adicional:          toStr(g('adicional')),
        // 'duration' from MySQL is dropped (not in new schema)
        tourDate:           toDate(g('tourDate')),
        tourHour:           toStr(g('tourHour')),
        local:              toStr(g('local')),
        status:             toStr(g('status')),
        language:           toStr(g('language')),
        client:             toStr(g('client')),
        paxAdult:           toInt(g('paxAdult')),
        paxHalf:            toInt(g('paxHalf')),
        paxFree:            toInt(g('paxFree')),
        paxNet:             toInt(g('paxNet')),
        paxBrazilian:       toInt(g('paxBrazilian')),
        currency:           toStr(g('currency')),
        paymentMethod:      toStr(g('paymentMethod')),
        totalValue:         toStr(g('totalValue')),
        numberOfGroups:     toInt(g('numberOfGroups')),
        ceGuide:            toStr(g('ceGuide')),
        clientName:         toStr(g('clientName')),
        clientContact:      toStr(g('clientContact')),
        country:            toStr(g('country')),
        emailSubject:       toStr(g('emailSubject')),
        companionName:      toStr(g('companionName')),
        companionContact:   toStr(g('companionContact')),
        commissioned:       toSmallInt(g('commissioned')),
        comments:           toStr(g('comments')),
        conversationHistory:toStr(g('conversationHistory')),
        paymentStatus:      toStr(g('paymentStatus')),
        financialComments:  toStr(g('financialComments')),
        year:               toStr(g('year')),
        dateOfRegistration: toDate(g('dateOfRegistration')),
        createdBy:          toStr(g('createdBy')),
        lastEditBy:         toStr(g('lastEditBy')),
        origin:             toStr(g('origin')) || 'office',
        dayOrderId:         dayOrderId,
        isHighSeason:       toSmallInt(g('isHighSeason')),
        canceled:           toSmallInt(g('canceled')),
        cancelReason:       toStr(g('cancelReason')),
        lateCheck:          toSmallInt(g('lateCheck')),
        paymentDate:        toDate(g('paymentDate')),
        netValue:           toDecimal(g('netValue')),
        company:            toStr(g('company')),
        invoiceNumber:      toStr(g('invoiceNumber')),
        accountNumber:      toStr(g('accountNumber')),
      };
    },
  },

  comissions: {
    pgTable: 'comissions',
    fkFilters: [{ col: 'tourId', parentTable: 'tour', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      return {
        id:                   toInt(g('id')),
        tourId:               toFKId(g('tourId')),
        orderRef:             toStr(g('orderRef')),
        comissionersName:     toStr(g('comissionersName')),
        comissionersContact:  toStr(g('comissionersContact')),
        comissionCurrency:    toStr(g('comissionCurrency')),
        comissionPrice:       toStr(g('comissionPrice')),
        comissionPaid:        toSmallInt(g('comissionPaid')),
        createdBy:            toStr(g('createdBy')),
        lastEditBy:           toStr(g('lastEditBy')),
        year:                 toStr(g('year')),
        dateOfRegistration:   toDate(g('dateOfRegistration')),
        deleted:              toSmallInt(g('deleted')),
      };
    },
  },

  changeRequests: {
    pgTable: 'changeRequests',
    fkFilters: [{ col: 'tourId', parentTable: 'tour', nullable: true }],
    transform(v, c) {
      const g = (col) => v[c.indexOf(col)];
      // tourId is VARCHAR in MySQL — convert to int, skip if not numeric
      const tourIdRaw = g('tourId');
      const tourId = tourIdRaw !== null && /^\d+$/.test(String(tourIdRaw).trim())
        ? toInt(tourIdRaw)
        : null;
      return {
        id:        toInt(g('id')),
        type:      toStr(g('type')),
        name:      toStr(g('name')),
        oldValue:  toStr(g('oldValue')),
        newValue:  toStr(g('newValue')),
        tourId:    tourId,
        createdBy: toStr(g('createdBy')),
      };
    },
  },
};

// Migration order respects FK dependencies
const MIGRATION_ORDER = [
  'users',
  'dayOrderEmployeesFunctions',
  'dayOrderEmployeesList',
  'settings',
  'product',
  'dayOrder',
  'customers',
  'tokens',
  'variant',
  'customerContacts',
  'dayOrderEmployee',
  'dayOrderAssociateGuidesInTours',
  'dayOrderPayments',
  'dayOrderEmployeesRemunerations',
  'numberOfGroups',
  'tour',
  'comissions',
  'changeRequests',
];

// ─── MySQL dump parser ────────────────────────────────────────────────────────

/**
 * Parses a MySQL VALUES row string (without surrounding parens).
 * Returns an array of JS values: string | number | null
 */
function parseRow(rowStr) {
  const values = [];
  let i = 0;

  while (i < rowStr.length) {
    // Skip leading whitespace
    while (i < rowStr.length && ' \t\r\n'.includes(rowStr[i])) i++;
    if (i >= rowStr.length) break;

    let value;

    if (rowStr[i] === "'") {
      // Quoted string
      i++; // skip opening quote
      let str = '';
      while (i < rowStr.length) {
        if (rowStr[i] === '\\' && i + 1 < rowStr.length) {
          const esc = rowStr[i + 1];
          switch (esc) {
            case "'":  str += "'";  break;
            case '\\': str += '\\'; break;
            case 'n':  str += '\n'; break;
            case 'r':  str += '\r'; break;
            case 't':  str += '\t'; break;
            case '0':  str += '\0'; break;
            default:   str += esc;
          }
          i += 2;
        } else if (rowStr[i] === "'") {
          i++; // skip closing quote
          break;
        } else {
          str += rowStr[i++];
        }
      }
      value = str;
    } else if (rowStr.slice(i, i + 4) === 'NULL') {
      value = null;
      i += 4;
    } else {
      // Number or unquoted literal
      let numStr = '';
      while (i < rowStr.length && rowStr[i] !== ',') {
        numStr += rowStr[i++];
      }
      numStr = numStr.trim();
      if (numStr === '') {
        value = null;
      } else {
        const n = Number(numStr);
        value = isNaN(n) ? numStr : n;
      }
    }

    values.push(value);

    // Skip trailing whitespace then comma separator
    while (i < rowStr.length && ' \t\r\n'.includes(rowStr[i])) i++;
    if (i < rowStr.length && rowStr[i] === ',') i++;
  }

  return values;
}

/**
 * Reads the MySQL dump and returns a Map<tableName, {columns, rows}>
 */
async function parseDump(filePath) {
  const data = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let currentTable = null;
  let currentColumns = [];
  // Buffer to accumulate a row that may have been split across lines
  let rowBuffer = '';

  for await (const line of rl) {
    const trimmed = line.trim();

    // Match: INSERT INTO `tableName` (`col1`, `col2`, ...) VALUES
    const insertMatch = trimmed.match(/^INSERT INTO `(\w+)` \(([^)]+)\) VALUES/i);
    if (insertMatch) {
      currentTable = insertMatch[1];
      currentColumns = insertMatch[2]
        .split(',')
        .map(col => col.trim().replace(/`/g, ''));
      if (!data.has(currentTable)) {
        data.set(currentTable, { columns: currentColumns, rows: [] });
      }
      rowBuffer = '';
      continue;
    }

    if (!currentTable) continue;

    // Accumulate row buffer
    rowBuffer += (rowBuffer ? ' ' : '') + trimmed;

    // Process complete rows from the buffer
    // A row ends with '), ' or ');' or ')' at end of buffer
    let processedUpTo = 0;
    let depth = 0;
    let inStr = false;
    let escape = false;

    for (let i = 0; i < rowBuffer.length; i++) {
      const ch = rowBuffer[i];

      if (escape) { escape = false; continue; }
      if (ch === '\\' && inStr) { escape = true; continue; }
      if (ch === "'" ) { inStr = !inStr; continue; }
      if (inStr) continue;

      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          // We have a complete row from processedUpTo to i (inclusive)
          const rowContent = rowBuffer.slice(processedUpTo + 1, i); // content between ( and )
          const entry = data.get(currentTable);
          if (entry) {
            entry.rows.push(parseRow(rowContent));
          }

          // Skip the `,` or `;` after `)`
          let next = i + 1;
          while (next < rowBuffer.length && ' \t\r\n'.includes(rowBuffer[next])) next++;
          if (rowBuffer[next] === ',' || rowBuffer[next] === ';') {
            if (rowBuffer[next] === ';') currentTable = null;
            next++;
          }
          processedUpTo = next;
          i = next - 1; // will be incremented by for loop
        }
      }
    }

    rowBuffer = rowBuffer.slice(processedUpTo);
  }

  return data;
}

// ─── PostgreSQL insertion ─────────────────────────────────────────────────────

async function insertRows(pgTable, pgRows, batchSize = 200) {
  if (pgRows.length === 0) return;

  const columns = Object.keys(pgRows[0]);
  let inserted = 0;

  for (let offset = 0; offset < pgRows.length; offset += batchSize) {
    const batch = pgRows.slice(offset, offset + batchSize);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of batch) {
        const vals = columns.map(col => row[col]);
        const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(', ');
        const colNames = columns.map(col => `"${col}"`).join(', ');
        const sql = `INSERT INTO "${pgTable}" (${colNames}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
        await client.query(sql, vals);
        inserted++;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return inserted;
}

async function resetSequences() {
  const tables = [
    'users', 'settings', 'product', 'variant', 'customers', 'customerContacts',
    'dayOrder', 'dayOrderEmployee', 'dayOrderAssociateGuidesInTours',
    'dayOrderEmployeesFunctions', 'dayOrderEmployeesList',
    'dayOrderEmployeesRemunerations', 'dayOrderPayments',
    'tokens', 'numberOfGroups', 'tour', 'comissions', 'changeRequests',
  ];

  const client = await pool.connect();
  try {
    for (const table of tables) {
      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1)
        )
      `);
    }
  } finally {
    client.release();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== MySQL → PostgreSQL Migration ===\n');
  console.log(`Dump: ${DUMP_PATH}`);
  console.log(`DB:   ${process.env.DATABASE_URL}\n`);

  // 1. Parse dump
  process.stdout.write('Parsing dump file... ');
  const dumpData = await parseDump(DUMP_PATH);
  console.log('done.');

  for (const [table, { rows }] of dumpData) {
    if (table !== 'aux') {
      console.log(`  ${table}: ${rows.length} rows found in dump`);
    }
  }
  console.log();

  // 2. Truncate all tables in reverse FK order (to reset cleanly)
  console.log('Clearing existing data...');
  const client = await pool.connect();
  try {
    await client.query(`
      TRUNCATE TABLE
        "changeRequests", "comissions", "tour",
        "numberOfGroups", "dayOrderEmployeesRemunerations", "dayOrderPayments",
        "dayOrderAssociateGuidesInTours", "dayOrderEmployee",
        "customerContacts", "variant", "tokens",
        "customers", "dayOrder", "product", "settings",
        "dayOrderEmployeesList", "dayOrderEmployeesFunctions",
        "users"
      RESTART IDENTITY CASCADE
    `);
  } finally {
    client.release();
  }
  console.log('Done.\n');

  // 3. Migrate each table
  let totalRows = 0;
  let totalErrors = 0;

  // Track IDs successfully inserted per pgTable, for FK filtering
  const insertedIds = {}; // { pgTable: Set<number> }

  for (const mysqlTable of MIGRATION_ORDER) {
    const config = TABLES[mysqlTable];
    if (!config) continue;

    const entry = dumpData.get(mysqlTable);
    if (!entry || entry.rows.length === 0) {
      console.log(`[SKIP] ${mysqlTable} — no data in dump`);
      continue;
    }

    const { columns, rows } = entry;
    const pgRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const transformed = config.transform(rows[i], columns);

        // FK filtering: skip rows referencing IDs that were never inserted
        let skip = false;
        if (config.fkFilters) {
          for (const { col, parentTable, nullable } of config.fkFilters) {
            const fkVal = transformed[col];
            if (fkVal === null || fkVal === undefined) {
              // NULL FK is fine only if the column is nullable
              if (!nullable) { skip = true; break; }
              continue;
            }
            const parentIds = insertedIds[parentTable];
            if (parentIds && !parentIds.has(fkVal)) {
              skip = true;
              break;
            }
          }
        }

        if (!skip) pgRows.push(transformed);
      } catch (err) {
        errors.push({ row: i, error: err.message });
      }
    }

    const skipped = rows.length - pgRows.length - errors.length;

    if (errors.length > 0) {
      console.warn(`  [WARN] ${mysqlTable}: ${errors.length} rows failed transform`);
      errors.slice(0, 3).forEach(e => console.warn(`    row ${e.row}: ${e.error}`));
    }

    try {
      const inserted = await insertRows(config.pgTable, pgRows);

      // Record inserted IDs for FK filtering of child tables
      if (!insertedIds[mysqlTable]) insertedIds[mysqlTable] = new Set();
      for (const row of pgRows) {
        if (row.id) insertedIds[mysqlTable].add(row.id);
      }

      const skippedMsg = skipped > 0 ? ` (${skipped} skipped — orphaned FK)` : '';
      console.log(`[OK]   ${mysqlTable}: ${inserted} rows inserted${skippedMsg}`);
      totalRows += inserted;
      totalErrors += errors.length;
    } catch (err) {
      console.error(`[FAIL] ${mysqlTable}: ${err.message}`);
      totalErrors++;
    }
  }

  // 4. Reset sequences
  console.log('\nResetting sequences...');
  await resetSequences();
  console.log('Done.');

  console.log(`\n=== Migration complete ===`);
  console.log(`  Rows inserted: ${totalRows}`);
  console.log(`  Errors:        ${totalErrors}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
