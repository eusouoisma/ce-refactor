const { formatDate } = require('../../shared/db');

// Integer/numeric columns — use numeric IN clause and numeric ORDER BY
const NUMERIC_COL_KEYS = new Set(['comissionPrice']);
// Boolean 0/1 columns — display as 'Não'/'Sim', reverse-map on filter
const BOOL_MAP_COL_KEYS = new Set(['comissionPaid']);

const FILTERABLE_COMISSION_COLS = {
  orderRef:            'c."orderRef"',
  tourDateFormated:    "TO_CHAR(t.\"tourDate\", 'DD/MM/YYYY')",
  comissionersName:    'c."comissionersName"',
  comissionersContact: 'c."comissionersContact"',
  comissionCurrency:   'c."comissionCurrency"',
  comissionPrice:      'c."comissionPrice"',
  comissionPaid:       'c."comissionPaid"',
  createdBy:           'c."createdBy"',
  lastEditBy:          'c."lastEditBy"',
};

class ComissionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  _buildColClause(dbCol, values, params) {
    const hasBlank  = values.includes('__VAZIO__');
    const nonBlank  = values.filter(v => v !== '__VAZIO__');
    const blankSQL  = `COALESCE(${dbCol}, '') = ''`;
    if (hasBlank && nonBlank.length > 0) {
      const ph = nonBlank.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...nonBlank);
      return `(${dbCol} IN (${ph}) OR ${blankSQL})`;
    }
    if (hasBlank) return blankSQL;
    const ph = nonBlank.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...nonBlank);
    return `${dbCol} IN (${ph})`;
  }

  _buildNumericClause(dbCol, values, params) {
    const nums = values.filter(v => v !== '__VAZIO__' && v !== '' && !isNaN(v));
    if (!nums.length) return null;
    const ph = nums.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...nums.map(Number));
    return `${dbCol} IN (${ph})`;
  }

  _buildBoolMapClause(dbCol, values, params) {
    const mapped = values
      .filter(v => v !== '__VAZIO__')
      .map(v => v === 'Sim' ? 1 : v === 'Não' ? 0 : null)
      .filter(v => v !== null);
    if (!mapped.length) return null;
    const ph = mapped.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...mapped);
    return `${dbCol} IN (${ph})`;
  }

  _selectExprForOptions(colKey, dbCol) {
    if (NUMERIC_COL_KEYS.has(colKey))  return `CAST(${dbCol} AS TEXT)`;
    if (BOOL_MAP_COL_KEYS.has(colKey)) return `CAST(${dbCol} AS TEXT)`;
    return `COALESCE(${dbCol}, '')`;
  }

  _orderByForOptions(colKey) {
    if (NUMERIC_COL_KEYS.has(colKey)) return `CAST(NULLIF(value, '') AS BIGINT) ASC NULLS LAST`;
    return `value ASC`;
  }

  _wrapForOptions(colKey, innerSQL) {
    if (NUMERIC_COL_KEYS.has(colKey)) return `SELECT value FROM (${innerSQL}) _opts`;
    return innerSQL;
  }

  _extractOptions(colKey, rows) {
    if (NUMERIC_COL_KEYS.has(colKey)) return rows.map(r => r.value).filter(Boolean);
    if (BOOL_MAP_COL_KEYS.has(colKey)) {
      const map = { '0': 'Não', '1': 'Sim' };
      return [...new Set(rows.map(r => map[r.value] ?? r.value))].sort();
    }
    return rows.map(r => r.value === '' ? '__VAZIO__' : r.value);
  }

  _dispatchClause(colKey, dbCol, values, params) {
    if (NUMERIC_COL_KEYS.has(colKey))  return this._buildNumericClause(dbCol, values, params);
    if (BOOL_MAP_COL_KEYS.has(colKey)) return this._buildBoolMapClause(dbCol, values, params);
    return this._buildColClause(dbCol, values, params);
  }

  _buildFilterClauses(filters, whitelist, params) {
    const clauses = [];
    for (const [key, rawVal] of Object.entries(filters || {})) {
      if (!key.startsWith('f_')) continue;
      const colKey = key.slice(2);
      const dbCol = whitelist[colKey];
      if (!dbCol) continue;
      const values = decodeURIComponent(rawVal).split('|').map(v => v.trim()).filter(v => v !== '');
      if (!values.length) continue;
      const clause = this._dispatchClause(colKey, dbCol, values, params);
      if (clause) clauses.push(clause);
    }
    return clauses;
  }

  _buildFilterClausesExcluding(filters, whitelist, excludeKey, params) {
    const clauses = [];
    for (const [key, rawVal] of Object.entries(filters || {})) {
      if (!key.startsWith('f_')) continue;
      const colKey = key.slice(2);
      if (colKey === excludeKey) continue;
      const dbCol = whitelist[colKey];
      if (!dbCol) continue;
      const values = decodeURIComponent(rawVal).split('|').map(v => v.trim()).filter(v => v !== '');
      if (!values.length) continue;
      const clause = this._dispatchClause(colKey, dbCol, values, params);
      if (clause) clauses.push(clause);
    }
    return clauses;
  }

  async insert(tourId, orderRef, data, year, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [tourId, orderRef, data.comissionersName || '', data.comissionersContact || '',
       data.comissionCurrency || '', data.comissionPrice || '', data.comissionPaid ? '1' : '0',
       data.createdBy || '', data.lastEditBy || '', year, data.dateOfRegistration || null]
    );
  }

  async findById(id) {
    const res = await this.pool.query(`SELECT * FROM comissions WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findById_linked(id, tx) {
    const db = this._db(tx);
    const res = await db.query(`SELECT id FROM comissions WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findAll(year, months, filters) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const params = [year, ...monthsArr];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_COMISSION_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';

    const res = await this.pool.query(
      `SELECT c.*, t."tourDate"
       FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
       WHERE t.canceled = 0 AND c.deleted = 0
         AND EXTRACT(YEAR FROM t."tourDate") = $1
         AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
         ${filterSQL}
       ORDER BY t."tourDate" ASC`,
      params
    );
    return res.rows.map(r => ({ ...r, tourDateFormated: formatDate(r.tourDate) }));
  }

  async update(id, data, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE comissions SET "comissionersName"=$1,"comissionersContact"=$2,"comissionCurrency"=$3,
       "comissionPrice"=$4,"comissionPaid"=$5,"lastEditBy"=$6 WHERE id=$7`,
      [data.comissionersName || '', data.comissionersContact || '', data.comissionCurrency || '',
       data.comissionPrice || '', data.comissionPaid ? '1' : '0', data.lastEditBy || '', id]
    );
  }

  async updateWithOrderRef(id, data, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE comissions SET "orderRef"=$1,"comissionersName"=$2,"comissionersContact"=$3,
       "comissionCurrency"=$4,"comissionPrice"=$5,"comissionPaid"=$6,"lastEditBy"=$7 WHERE id=$8`,
      [data.orderRef || '', data.comissionersName || '', data.comissionersContact || '',
       data.comissionCurrency || '', data.comissionPrice || '', data.comissionPaid ? '1' : '0',
       data.lastEditBy || '', id]
    );
  }

  async softDelete(id) {
    const res = await this.pool.query(`SELECT "tourId" FROM comissions WHERE id = $1`, [id]);
    if (!res.rows.length) return null;
    const tourId = res.rows[0].tourId;
    await this.pool.query(`UPDATE comissions SET deleted = 1 WHERE id = $1`, [id]);
    return tourId;
  }

  async markTourUncommissioned(tourId) {
    await this.pool.query(`UPDATE tour SET commissioned = 0 WHERE id = $1`, [tourId]);
  }

  async setPaid(id, lastEditBy) {
    await this.pool.query(
      `UPDATE comissions SET "comissionPaid" = 1, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async setUnpaid(id, lastEditBy) {
    await this.pool.query(
      `UPDATE comissions SET "comissionPaid" = 0, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async findAllPaginated(year, months, filters, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);
    const baseParams = [year, ...monthsArr];
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_COMISSION_COLS, baseParams);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';

    const whereBase = `t.canceled = 0 AND c.deleted = 0
        AND EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        ${filterSQL}`;

    const [data, count, agg] = await Promise.all([
      this.pool.query(
        `SELECT c.*, t."tourDate"
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}
         ORDER BY t."tourDate" ASC
         LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
        [...baseParams, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int as total
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}`,
        baseParams
      ),
      this.pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN c."comissionCurrency" = 'R$' AND c."comissionPrice" ~ '^[0-9]+(\\.[0-9]+)?$' THEN c."comissionPrice"::NUMERIC ELSE 0 END), 0) AS "totalReal",
           COALESCE(SUM(CASE WHEN c."comissionCurrency" = '$' AND c."comissionPrice" ~ '^[0-9]+(\\.[0-9]+)?$' THEN c."comissionPrice"::NUMERIC ELSE 0 END), 0) AS "totalDollar"
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}`,
        baseParams
      ),
    ]);

    return {
      rows: data.rows.map(r => ({ ...r, tourDateFormated: formatDate(r.tourDate) })),
      total: count.rows[0].total,
      totals: {
        totalReal:   parseFloat(agg.rows[0].totalReal)   || 0,
        totalDollar: parseFloat(agg.rows[0].totalDollar) || 0,
      },
    };
  }

  async findFilterOptions(year, months, filters, column = null) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const entries = column
      ? Object.entries(FILTERABLE_COMISSION_COLS).filter(([k]) => k === column)
      : Object.entries(FILTERABLE_COMISSION_COLS);

    const result = {};
    await Promise.all(entries.map(async ([key, col]) => {
      const params = [year, ...monthsArr];
      const clauses = this._buildFilterClausesExcluding(filters, FILTERABLE_COMISSION_COLS, key, params);
      const filterSQL = clauses.length ? 'AND ' + clauses.join(' AND ') : '';
      const selectExpr = this._selectExprForOptions(key, col);
      const orderBy   = this._orderByForOptions(key);
      const innerSQL  = `SELECT DISTINCT ${selectExpr} AS value
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE t.canceled = 0 AND c.deleted = 0
           AND EXTRACT(YEAR FROM t."tourDate") = $1
           AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
           ${filterSQL}`;
      const res = await this.pool.query(
        `${this._wrapForOptions(key, innerSQL)} ORDER BY ${orderBy}`,
        params
      );
      result[key] = this._extractOptions(key, res.rows);
    }));
    return result;
  }
}

module.exports = { ComissionRepository };
