const express = require('express');
const { pool, formatDate } = require('../db');

const router = express.Router();

// POST /reports/analysis-by-country
router.post('/analysis-by-country', async (req, res) => {
  const { startDate, endDate, orderBy, from, to } = req.body;
  try {
    const sql = `
      SELECT country, currency,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
             SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0
        AND "tourDate" >= $1 AND "tourDate" <= $2
      GROUP BY country, currency
      ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}
    `;
    const result = await pool.query(sql, [startDate, endDate]);
    const totalPax = result.rows.reduce((s, r) => s + parseInt(r.totalPax||0), 0);
    const totalValor = result.rows.reduce((s, r) => s + parseFloat(r.valorTotal||0), 0);
    const rows = result.rows.map((r, i) => ({
      ...r,
      index: i + 1,
      paxPercent: totalPax ? ((parseInt(r.totalPax||0) / totalPax) * 100).toFixed(1) : '0',
      valorPercent: totalValor ? ((parseFloat(r.valorTotal||0) / totalValor) * 100).toFixed(1) : '0',
    }));
    const paginated = rows.slice((from||0), (to||rows.length));
    res.json(paginated);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /reports/analysis-by-customers
router.post('/analysis-by-customers', async (req, res) => {
  const { startDate, endDate, clientSearch, orderBy, from, to } = req.body;
  try {
    let sql = `
      SELECT client, currency,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
             SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0
        AND "tourDate" >= $1 AND "tourDate" <= $2
    `;
    const params = [startDate, endDate];
    if (clientSearch) {
      params.push(`%${clientSearch}%`);
      sql += ` AND client ILIKE $${params.length}`;
    }
    sql += ` GROUP BY client, currency ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}`;
    const result = await pool.query(sql, params);
    const totalPax = result.rows.reduce((s, r) => s + parseInt(r.totalPax||0), 0);
    const totalValor = result.rows.reduce((s, r) => s + parseFloat(r.valorTotal||0), 0);
    const rows = result.rows.map((r, i) => ({
      ...r,
      index: i + 1,
      paxPercent: totalPax ? ((parseInt(r.totalPax||0) / totalPax) * 100).toFixed(1) : '0',
      valorPercent: totalValor ? ((parseFloat(r.valorTotal||0) / totalValor) * 100).toFixed(1) : '0',
    }));
    res.json(rows.slice((from||0), (to||rows.length)));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /reports/analysis-by-product
router.post('/analysis-by-product', async (req, res) => {
  const { startDate, endDate, orderBy, from, to } = req.body;
  try {
    const sql = `
      SELECT activity, currency,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
             SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0
        AND "tourDate" >= $1 AND "tourDate" <= $2
      GROUP BY activity, currency
      ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}
    `;
    const result = await pool.query(sql, [startDate, endDate]);
    const totalPax = result.rows.reduce((s, r) => s + parseInt(r.totalPax||0), 0);
    const totalValor = result.rows.reduce((s, r) => s + parseFloat(r.valorTotal||0), 0);
    const rows = result.rows.map((r, i) => ({
      ...r,
      index: i + 1,
      paxPercent: totalPax ? ((parseInt(r.totalPax||0) / totalPax) * 100).toFixed(1) : '0',
      valorPercent: totalValor ? ((parseFloat(r.valorTotal||0) / totalValor) * 100).toFixed(1) : '0',
    }));
    res.json(rows.slice((from||0), (to||rows.length)));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /reports/analysis-by-hour
router.post('/analysis-by-hour', async (req, res) => {
  const { startDate, endDate, day, activities } = req.body;
  try {
    const dayFilter = day && day !== 'ALL'
      ? `AND TO_CHAR("tourDate", 'DY') = '${day}'`
      : '';
    const actFilter = activities && activities.length > 0
      ? `AND activity IN (${activities.map((_, i) => `$${i + 3}`).join(',')})`
      : '';

    const isRegularOnly = activities && activities.length === 1 && activities[0] === 'Regular';

    const hourExpr = isRegularOnly
      ? `"tourHour"`
      : `LPAD(EXTRACT(HOUR FROM "tourHour"::time)::TEXT, 2, '0') || ':00'`;

    const sql = `
      SELECT ${hourExpr} as hora,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as total
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0
        AND "tourDate" >= $1 AND "tourDate" <= $2
        ${dayFilter}
        ${actFilter}
      GROUP BY hora
      ORDER BY hora ASC
    `;
    const params = [startDate, endDate, ...(activities || [])];
    const result = await pool.query(sql, params);
    res.json({ data: result.rows, debug: {} });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /reports/analysis-by-weekday
router.post('/analysis-by-weekday', async (req, res) => {
  const { startDate, endDate, day, applyDayFilter, activities } = req.body;
  try {
    const actFilter = activities && activities.length > 0
      ? `AND activity IN (${activities.map((_, i) => `$${i + 3}`).join(',')})`
      : '';
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const sql = `
      SELECT EXTRACT(DOW FROM "tourDate")::INT as dow,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as total
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0
        AND "tourDate" >= $1 AND "tourDate" <= $2
        ${actFilter}
      GROUP BY dow
      ORDER BY dow ASC
    `;
    const result = await pool.query(sql, [startDate, endDate, ...(activities || [])]);
    const dataMap = {};
    result.rows.forEach(r => { dataMap[r.dow] = parseInt(r.total); });
    const data = dayNames.map((name, i) => ({ dia: name, total: dataMap[i] || 0 }));
    res.json({ data, debug: {} });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /reports/analysis-regular-tour
router.post('/analysis-regular-tour', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const result = await pool.query(
      `SELECT SUM("paxAdult") as "paxAdult", SUM("paxHalf") as "paxHalf",
              SUM("paxFree") as "paxFree", SUM("paxNet") as "paxNet",
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax"
       FROM tour
       WHERE status = 'Confirmado' AND canceled = 0 AND type = 'regular'
         AND "tourDate" >= $1 AND "tourDate" <= $2`,
      [startDate, endDate]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /reports/available-activities
router.get('/available-activities', async (req, res) => {
  res.json(['Regular', 'Tour 1', 'Mix Tour 1']);
});

module.exports = router;
