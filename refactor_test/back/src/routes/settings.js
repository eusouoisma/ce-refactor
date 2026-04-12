const express = require('express');
const { pool, getCurrentYear } = require('../db');

const router = express.Router();

// GET /settings/list-all
router.get('/list-all', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, type, value FROM settings ORDER BY value ASC`);
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /settings/create
router.post('/create', async (req, res) => {
  const { type, value } = req.body;
  try {
    const currentYear = await getCurrentYear();
    await pool.query(
      `INSERT INTO settings (type, value, year) VALUES ($1,$2,$3)`,
      [type||'', value||'', currentYear]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /settings/delete
router.get('/delete', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM settings WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /settings/update-current-year
router.post('/update-current-year', async (req, res) => {
  const { value } = req.body;
  try {
    await pool.query(`UPDATE settings SET value = $1 WHERE type = 'currentYear'`, [value]);
    await pool.query(`UPDATE settings SET value = $1 WHERE type = 'CurrentYear'`, [value]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /settings/current-year
router.get('/current-year', async (req, res) => {
  try {
    const result = await pool.query(`SELECT value FROM settings WHERE type = 'CurrentYear' LIMIT 1`);
    res.json(result.rows[0]?.value || '');
  } catch (err) {
    res.json('');
  }
});

// Generic handler for settings by type
function makeSettingsTypeRoute(type) {
  return async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT value FROM settings WHERE type = $1 ORDER BY value ASC`, [type]
      );
      res.json(result.rows);
    } catch (err) {
      res.json([]);
    }
  };
}

router.get('/activities', makeSettingsTypeRoute('activity'));
router.get('/platforms', makeSettingsTypeRoute('platform'));
router.get('/languages', makeSettingsTypeRoute('language'));
router.get('/status', makeSettingsTypeRoute('status'));
router.get('/currencies', makeSettingsTypeRoute('currency'));
router.get('/payment-methods', makeSettingsTypeRoute('paymentMethod'));
router.get('/payment-status', makeSettingsTypeRoute('paymentStatus'));
router.get('/locals', makeSettingsTypeRoute('local'));
router.get('/guides', makeSettingsTypeRoute('guide'));
router.get('/companies', makeSettingsTypeRoute('company'));
router.get('/account-numbers', makeSettingsTypeRoute('accountNumber'));
router.get('/countries', makeSettingsTypeRoute('country'));

module.exports = router;
