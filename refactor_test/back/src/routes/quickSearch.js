const express = require('express');
const { pool, formatDate } = require('../db');

const router = express.Router();

// POST /quick-search/search
router.post('/search', async (req, res) => {
  const { reserva, cliente } = req.body;
  try {
    const reservas = [];
    const clientes = [];

    if (reserva) {
      const r = await pool.query(
        `SELECT DISTINCT "orderRef" as value, "orderRef" as label
         FROM tour WHERE "orderRef" ILIKE $1 AND status = 'Confirmado' AND canceled = 0 LIMIT 10`,
        [`%${reserva}%`]
      );
      reservas.push(...r.rows);
    }

    if (cliente) {
      const c = await pool.query(
        `SELECT DISTINCT client as value, client as label
         FROM tour WHERE client ILIKE $1 AND status = 'Confirmado' AND canceled = 0 LIMIT 10`,
        [`%${cliente}%`]
      );
      clientes.push(...c.rows);
    }

    res.json({ reservas, clientes });
  } catch (err) {
    res.json({ reservas: [], clientes: [] });
  }
});

// POST /quick-search/search-tours
router.post('/search-tours', async (req, res) => {
  const { reserva, cliente } = req.body;
  try {
    let where = `status = 'Confirmado' AND canceled = 0`;
    const params = [];

    if (reserva) {
      params.push(`%${reserva}%`);
      where += ` AND "orderRef" ILIKE $${params.length}`;
    }
    if (cliente) {
      params.push(`%${cliente}%`);
      where += ` AND client ILIKE $${params.length}`;
    }

    const result = await pool.query(
      `SELECT *, ("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
              EXTRACT(DOW FROM "tourDate")::INT as "weekDay"
       FROM tour WHERE ${where} ORDER BY "tourDate" DESC LIMIT 50`,
      params
    );
    res.json({
      tours: result.rows.map(r => ({
        ...r,
        dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
      })),
    });
  } catch (err) {
    res.json({ tours: [] });
  }
});

module.exports = router;
