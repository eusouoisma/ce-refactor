const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// POST /numberOfGroups/create
router.post('/create', async (req, res) => {
  const { id, type, date, hour, activity, groups } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (type === 'regular') {
      await client.query(
        `DELETE FROM "numberOfGroups" WHERE date = $1 AND hour = $2 AND activity = $3`,
        [date, hour, activity]
      );
      await client.query(
        `INSERT INTO "numberOfGroups" (date, hour, activity, groups) VALUES ($1,$2,$3,$4)`,
        [date, hour, activity, groups]
      );
    } else {
      await client.query(
        `UPDATE tour SET "numberOfGroups" = $1 WHERE id = $2`,
        [groups, id]
      );
    }
    await client.query('COMMIT');
    res.json({ error: false });
  } catch (err) {
    await client.query('ROLLBACK');
    res.json({ error: true, message: err.message });
  } finally {
    client.release();
  }
});

// GET /numberOfGroups/list-all
router.get('/list-all', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "numberOfGroups"`);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
