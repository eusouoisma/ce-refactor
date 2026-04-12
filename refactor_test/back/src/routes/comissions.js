const express = require('express');
const { pool, getCurrentYear, formatDate } = require('../db');

const router = express.Router();

// GET /comissions/list-all
router.get('/list-all', async (req, res) => {
  try {
    const { months, year } = req.query;
    const currentYear = await getCurrentYear();
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 3}`).join(',');
    const sql = `
      SELECT c.*, t."tourDate"
      FROM comissions c
      INNER JOIN tour t ON t.id = c."tourId"
      WHERE t.canceled = 0
        AND c.deleted = 0
        AND t.year = $1
        AND EXTRACT(YEAR FROM t."tourDate") = $2
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
      ORDER BY t."tourDate" ASC
    `;
    const result = await pool.query(sql, [currentYear, year, ...monthsArr]);
    res.json(result.rows.map(r => ({ ...r, tourDateFormated: formatDate(r.tourDate) })));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /comissions/list-by-id
router.get('/list-by-id', async (req, res) => {
  const { comission_id } = req.query;
  try {
    const result = await pool.query(`SELECT * FROM comissions WHERE id = $1`, [comission_id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /comissions/update (with ?id=)
router.post('/update', async (req, res) => {
  const { id } = req.query;
  const d = req.body;
  try {
    await pool.query(
      `UPDATE comissions SET "orderRef"=$1,"comissionersName"=$2,"comissionersContact"=$3,
       "comissionCurrency"=$4,"comissionPrice"=$5,"comissionPaid"=$6,"lastEditBy"=$7
       WHERE id=$8`,
      [d.orderRef||'', d.comissionersName||'', d.comissionersContact||'',
       d.comissionCurrency||'', d.comissionPrice||'', d.comissionPaid?'1':'0', d.lastEditBy||'', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /comissions/delete
router.get('/delete', async (req, res) => {
  const { id } = req.query;
  try {
    // Soft delete comission + set tour.commissioned = 0
    const comRes = await pool.query(`SELECT "tourId" FROM comissions WHERE id = $1`, [id]);
    if (comRes.rows.length > 0) {
      const tourId = comRes.rows[0].tourId;
      await pool.query(`UPDATE comissions SET deleted = 1 WHERE id = $1`, [id]);
      await pool.query(`UPDATE tour SET commissioned = 0 WHERE id = $1`, [tourId]);
    }
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /comissions/pay
router.get('/pay', async (req, res) => {
  const { id, lastEditBy } = req.query;
  try {
    await pool.query(
      `UPDATE comissions SET "comissionPaid" = 1, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy||'', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /comissions/unpay
router.get('/unpay', async (req, res) => {
  const { id, lastEditBy } = req.query;
  try {
    await pool.query(
      `UPDATE comissions SET "comissionPaid" = 0, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy||'', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

module.exports = router;
