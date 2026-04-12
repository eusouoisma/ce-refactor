const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /changeRequests/get-by-tour-id
router.get('/get-by-tour-id', async (req, res) => {
  const { tour_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM "changeRequests" WHERE "tourId" = $1`, [tour_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
