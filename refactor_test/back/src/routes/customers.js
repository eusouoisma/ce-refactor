const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// POST /customers/create
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = req.body;
    const custIns = await client.query(
      `INSERT INTO customers ("customerName","customerType","createdBy","lastEditBy") VALUES ($1,$2,$3,$4) RETURNING id`,
      [d.customerName||'', d.customerType||'', d.createdBy||'', d.lastEditBy||'']
    );
    const customerId = custIns.rows[0].id;
    const contacts = d.contacts || [];
    for (const c of contacts) {
      await client.query(
        `INSERT INTO "customerContacts" ("customerId","contactName","contactContact","contactOffice","contactEmail","createdBy","lastEditBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [customerId, c.name||'', c.contact||'', c.office||'', c.email||'', d.createdBy||'', d.lastEditBy||'']
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

// POST /customers/update
router.post('/update', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = req.body;
    await client.query(
      `UPDATE customers SET "customerName"=$1,"customerType"=$2,"lastEditBy"=$3 WHERE id=$4`,
      [d.customerName||'', d.customerType||'', d.lastEditBy||'', d.customerId]
    );
    await client.query(`DELETE FROM "customerContacts" WHERE "customerId" = $1`, [d.customerId]);
    const contacts = d.contacts || [];
    for (const c of contacts) {
      await client.query(
        `INSERT INTO "customerContacts" ("customerId","contactName","contactContact","contactOffice","contactEmail","createdBy","lastEditBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [d.customerId, c.name||'', c.contact||'', c.office||'', c.email||'', d.createdBy||'', d.lastEditBy||'']
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

// GET /customers/delete (deletes a customerContact by id)
router.get('/delete', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM "customerContacts" WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /customers/list-all
router.get('/list-all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id as "customerId", c."customerName", c."customerType",
              cc.id as "contactId", cc."contactName", cc."contactContact", cc."contactOffice", cc."contactEmail"
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE cc.deleted = 0
       ORDER BY c."customerName" ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /customers/list-by-id
router.get('/list-by-id', async (req, res) => {
  const { customer_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT c.id as "customerId", c."customerName", c."customerType",
              cc.id as "contactId", cc."contactName", cc."contactContact", cc."contactOffice", cc."contactEmail"
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE c.id = $1
       ORDER BY cc.id ASC`,
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /customers/list-grouped
router.get('/list-grouped', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c."customerName" as name, c."customerType",
              JSON_AGG(JSON_BUILD_OBJECT('id', cc.id, 'contactName', cc."contactName", 'contactContact', cc."contactContact", 'contactEmail', cc."contactEmail") ORDER BY cc.id) as contacts
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE cc.deleted = 0
       GROUP BY c.id, c."customerName", c."customerType"
       ORDER BY c."customerName" ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
