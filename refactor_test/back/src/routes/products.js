const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// POST /products/create
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = req.body;
    const ins = await client.query(
      `INSERT INTO product (type, category, name, duration) VALUES ($1,$2,$3,$4) RETURNING id`,
      [d.type||'', d.category||'atividade', d.productName||'', d.duration||'']
    );
    const productId = ins.rows[0].id;
    const variants = d.variants || [];
    for (const v of variants) {
      await client.query(
        `INSERT INTO variant ("productId","pricingType","priceAdult","priceHalf","priceNet","priceBrazilian","priceFree","priceGroup","paxLimit",
         "priceAdultHighSeason","priceHalfHighSeason","priceNetHighSeason","priceFreeHighSeason","priceBrazilianHighSeason","priceGroupHighSeason")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [productId, v.pricingType||'person', v.priceAdult||0, v.priceHalf||0, v.priceNet||0,
         v.priceBrazilian||0, v.priceFree||0, v.priceGroup||0, v.paxLimit||0,
         v.priceAdultHighSeason||0, v.priceHalfHighSeason||0, v.priceNetHighSeason||0,
         v.priceFreeHighSeason||0, v.priceBrazilianHighSeason||0, v.priceGroupHighSeason||0]
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

// POST /products/update
router.post('/update', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = req.body;
    await client.query(
      `UPDATE product SET type=$1, category=$2, name=$3, duration=$4 WHERE id=$5`,
      [d.type||'', d.category||'atividade', d.productName||'', d.duration||'', d.productId]
    );
    await client.query(`DELETE FROM variant WHERE "productId" = $1`, [d.productId]);
    const variants = d.variants || [];
    for (const v of variants) {
      await client.query(
        `INSERT INTO variant ("productId","pricingType","priceAdult","priceHalf","priceNet","priceBrazilian","priceFree","priceGroup","paxLimit",
         "priceAdultHighSeason","priceHalfHighSeason","priceNetHighSeason","priceFreeHighSeason","priceBrazilianHighSeason","priceGroupHighSeason")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [d.productId, v.pricingType||'person', v.priceAdult||0, v.priceHalf||0, v.priceNet||0,
         v.priceBrazilian||0, v.priceFree||0, v.priceGroup||0, v.paxLimit||0,
         v.priceAdultHighSeason||0, v.priceHalfHighSeason||0, v.priceNetHighSeason||0,
         v.priceFreeHighSeason||0, v.priceBrazilianHighSeason||0, v.priceGroupHighSeason||0]
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

// GET /products/delete
router.get('/delete', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM product WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /products/list-all
router.get('/list-all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, v.id as "variantId", v."pricingType", v."priceAdult", v."priceHalf", v."priceNet",
              v."priceBrazilian", v."priceFree", v."priceGroup", v."paxLimit",
              v."priceAdultHighSeason", v."priceHalfHighSeason", v."priceNetHighSeason",
              v."priceFreeHighSeason", v."priceBrazilianHighSeason", v."priceGroupHighSeason"
       FROM product p
       LEFT JOIN variant v ON v."productId" = p.id
       ORDER BY p.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /products/list-by-id
router.get('/list-by-id', async (req, res) => {
  const { product_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT p.*, v.id as "variantId", v."pricingType", v."priceAdult", v."priceHalf", v."priceNet",
              v."priceBrazilian", v."priceFree", v."priceGroup", v."paxLimit",
              v."priceAdultHighSeason", v."priceHalfHighSeason", v."priceNetHighSeason",
              v."priceFreeHighSeason", v."priceBrazilianHighSeason", v."priceGroupHighSeason"
       FROM product p
       INNER JOIN variant v ON v."productId" = p.id
       WHERE p.id = $1`,
      [product_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
