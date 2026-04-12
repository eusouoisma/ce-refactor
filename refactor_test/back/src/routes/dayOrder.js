const express = require('express');
const { pool, formatDate } = require('../db');

const router = express.Router();

// POST /day-order/list-active
router.post('/list-active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*
       FROM "dayOrder" d
       WHERE EXISTS (
         SELECT 1 FROM tour t
         WHERE t."dayOrderId" = d.id
           AND t.status NOT IN ('Cancelado', 'Bloqueio')
           AND t.canceled = 0
           AND t."tourHour" != ''
       )
       ORDER BY d.date DESC`
    );
    res.json(result.rows.map(r => ({ ...r, formatedDate: formatDate(r.date) })));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /day-order/list-by-id
router.get('/list-by-id', async (req, res) => {
  const { day_order_id } = req.query;
  const client = await pool.connect();
  try {
    // Get dayOrder info
    const doRes = await client.query(`SELECT * FROM "dayOrder" WHERE id = $1`, [day_order_id]);
    if (doRes.rows.length === 0) return res.json({ error: true, message: 'Not found' });
    const dayOrder = doRes.rows[0];

    // Get prev/next dayOrders
    const prevRes = await client.query(
      `SELECT id FROM "dayOrder" WHERE date < $1 ORDER BY date DESC LIMIT 1`, [dayOrder.date]
    );
    const nextRes = await client.query(
      `SELECT id FROM "dayOrder" WHERE date > $1 ORDER BY date ASC LIMIT 1`, [dayOrder.date]
    );

    // Auto-insert guides from tours
    const guidesToursRes = await client.query(
      `SELECT DISTINCT UNNEST(STRING_TO_ARRAY(t."ceGuide", ',')) as guide
       FROM tour t
       WHERE t."dayOrderId" = $1 AND t."ceGuide" != '' AND t.canceled = 0`,
      [day_order_id]
    );
    const guideNames = guidesToursRes.rows.map(r => r.guide.trim()).filter(Boolean);

    for (const guide of guideNames) {
      const existing = await client.query(
        `SELECT id FROM "dayOrderEmployee" WHERE "dayOrderId" = $1 AND name = $2 AND function = 'Guia' AND deleted = 0`,
        [day_order_id, guide]
      );
      if (existing.rows.length === 0) {
        // Get phone from list
        const phoneRes = await client.query(
          `SELECT phone FROM "dayOrderEmployeesList" WHERE name = $1 LIMIT 1`, [guide]
        );
        await client.query(
          `INSERT INTO "dayOrderEmployee" ("dayOrderId", function, name, phone) VALUES ($1, 'Guia', $2, $3)`,
          [day_order_id, guide, phoneRes.rows[0]?.phone || '']
        );
      }
    }

    // Remove guides that no longer have tours
    const currentGuides = await client.query(
      `SELECT id, name FROM "dayOrderEmployee" WHERE "dayOrderId" = $1 AND function = 'Guia' AND deleted = 0`,
      [day_order_id]
    );
    for (const emp of currentGuides.rows) {
      if (!guideNames.includes(emp.name)) {
        await client.query(`UPDATE "dayOrderEmployee" SET deleted = 1 WHERE id = $1`, [emp.id]);
      }
    }

    // Auto-insert fixed employees if not yet done
    if (dayOrder.autoInserted == 0 && (dayOrder.name === 'Tour Principal' || dayOrder.name === 'Regular')) {
      const fixedRes = await client.query(
        `SELECT * FROM "dayOrderEmployeesList" WHERE type = 'Fixo'`
      );
      for (const emp of fixedRes.rows) {
        await client.query(
          `INSERT INTO "dayOrderEmployee" ("dayOrderId", function, name, phone) VALUES ($1,$2,$3,$4)`,
          [day_order_id, emp.function, emp.name, emp.phone]
        );
      }
      await client.query(`UPDATE "dayOrder" SET "autoInserted" = 1 WHERE id = $1`, [day_order_id]);
    }

    // Get employees with function orderNumber
    const empRes = await client.query(
      `SELECT de.*, COALESCE(df."orderNumber", 999) as "orderNumber"
       FROM "dayOrderEmployee" de
       LEFT JOIN "dayOrderEmployeesFunctions" df ON df.name = de.function
       WHERE de."dayOrderId" = $1 AND de.deleted = 0
       ORDER BY COALESCE(df."orderNumber", 999) ASC, de.name ASC`,
      [day_order_id]
    );

    res.json({
      error: false,
      infos: {
        ...dayOrder,
        formatedDate: formatDate(dayOrder.date),
        prev: prevRes.rows[0]?.id || null,
        next: nextRes.rows[0]?.id || null,
      },
      employees: empRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.json({ error: true, message: err.message });
  } finally {
    client.release();
  }
});

// GET /day-order/list-tours-by-dayorder-id
router.get('/list-tours-by-dayorder-id', async (req, res) => {
  const { id } = req.query;
  try {
    // Non-regular tours grouped by id
    const nonRegularRes = await pool.query(
      `SELECT t.id, t."tourDate", t."tourHour", t.type, t.activity, t.duration, t.language, t.status,
              t."ceGuide" as guides, (t."paxAdult"+t."paxHalf"+t."paxFree"+t."paxNet"+t."paxBrazilian") as "paxTotal"
       FROM tour t
       WHERE t."dayOrderId" = $1 AND t.canceled = 0 AND t.type != 'regular'
       ORDER BY t."tourHour" ASC`,
      [id]
    );

    // Regular tours grouped by date/hour/activity
    const regularRes = await pool.query(
      `SELECT MIN(t.id) as id, t."tourDate", t."tourHour", t.type, t.activity, t.duration, t.language, t.status,
              STRING_AGG(DISTINCT t."ceGuide", ',') as guides,
              SUM(t."paxAdult"+t."paxHalf"+t."paxFree"+t."paxNet"+t."paxBrazilian") as "paxTotal"
       FROM tour t
       WHERE t."dayOrderId" = $1 AND t.canceled = 0 AND t.type = 'regular'
       GROUP BY t."tourDate", t."tourHour", t.type, t.activity, t.duration, t.language, t.status
       ORDER BY t."tourHour" ASC`,
      [id]
    );

    const combined = [...nonRegularRes.rows, ...regularRes.rows]
      .sort((a, b) => (a.tourHour || '') < (b.tourHour || '') ? -1 : 1)
      .map(r => {
        const guides = r.guides
          ? [...new Set(r.guides.split(',').map(g => g.trim()).filter(Boolean))].join(',')
          : '';
        return { ...r, guides };
      });

    res.json({ error: false, data: combined });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /day-order/list-tours-by-date
router.get('/list-tours-by-date', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await pool.query(
      `SELECT t."tourDate", t."tourHour", t.type, t.activity, t.language,
              STRING_AGG(DISTINCT t."ceGuide", ',') as guides,
              SUM(t."paxAdult"+t."paxHalf"+t."paxFree"+t."paxNet"+t."paxBrazilian") as "paxTotal"
       FROM tour t
       WHERE t."tourDate" = $1 AND t.canceled = 0
       GROUP BY t."tourDate", t."tourHour", t.type, t.activity, t.language
       ORDER BY t."tourHour" ASC`,
      [date]
    );
    res.json({ error: false, data: result.rows });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /day-order/list-all-payments
router.get('/list-all-payments', async (req, res) => {
  const { months, year } = req.query;
  const monthsArr = months ? months.split(',').map(Number) : [];
  const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
  try {
    const sql = `
      SELECT dp.*, d.date, df."orderNumber"
      FROM "dayOrderPayments" dp
      INNER JOIN "dayOrder" d ON d.id = dp."dayOrderId"
      INNER JOIN "dayOrderEmployeesFunctions" df ON df.name = dp.function
      WHERE EXTRACT(YEAR FROM d.date) = $1
        AND EXTRACT(MONTH FROM d.date) IN (${monthsPlaceholders})
      ORDER BY d.date ASC, df."orderNumber" ASC, dp."employeeName" ASC
    `;
    const result = await pool.query(sql, [year, ...monthsArr]);
    res.json(result.rows.map(r => ({ ...r, formatedDate: formatDate(r.date) })));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/list-activities
router.post('/list-activities', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM product ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// GET /day-order/list-functions
router.get('/list-functions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM "dayOrderEmployeesFunctions" WHERE name != '' ORDER BY "orderNumber" ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// GET /day-order/list-employees-options
router.get('/list-employees-options', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "dayOrderEmployeesList" ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// GET /day-order/list-remunerations
router.get('/list-remunerations', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "dayOrderEmployeesRemunerations"`);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// POST /day-order/create-employee
router.post('/create-employee', async (req, res) => {
  const { dayOrderId, editedBy, employee } = req.body;
  try {
    await pool.query(`UPDATE "dayOrder" SET "lastEditBy" = $1 WHERE id = $2`, [editedBy||'', dayOrderId]);
    const ins = await pool.query(
      `INSERT INTO "dayOrderEmployee" ("dayOrderId", function, name, phone) VALUES ($1,$2,$3,$4) RETURNING id`,
      [dayOrderId, employee?.function||'', employee?.name||'', employee?.phone||'']
    );
    res.json({ error: false, data: ins.rows[0].id });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/create-employee-option
router.post('/create-employee-option', async (req, res) => {
  const { function: fn, type, name, phone } = req.body;
  try {
    const existing = await pool.query(
      `SELECT id FROM "dayOrderEmployeesList" WHERE name = $1 AND function = $2`, [name, fn]
    );
    if (existing.rows.length > 0) {
      return res.json({ error: true, message: 'Já existe um colaborador cadastrado com esse nome e função.' });
    }
    const ins = await pool.query(
      `INSERT INTO "dayOrderEmployeesList" (name, function, phone, type) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name||'', fn||'', phone||'', type||'']
    );
    res.json({ error: false, data: ins.rows[0].id });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/create-function
router.post('/create-function', async (req, res) => {
  const { name, orderNumber } = req.body;
  try {
    await pool.query(
      `INSERT INTO "dayOrderEmployeesFunctions" (name, "orderNumber") VALUES ($1,$2)`,
      [name||'', orderNumber||0]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /day-order/create-remuneration
router.post('/create-remuneration', async (req, res) => {
  const d = req.body;
  try {
    await pool.query(
      `INSERT INTO "dayOrderEmployeesRemunerations" ("functionId","paymentType","activity","hourlyValue1","hourlyValue2","hourlyValue3")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [d.functionId, d.paymentType||'day', d.activity||'', d.hourlyValue1||0, d.hourlyValue2||0, d.hourlyValue3||0]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/update-employees
router.post('/update-employees', async (req, res) => {
  const { dayOrderId, comments, lastEditBy, employees } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const emp of employees || []) {
      if (emp.deleted == 1 || emp.function === '') {
        await client.query(`UPDATE "dayOrderEmployee" SET deleted = 1 WHERE id = $1`, [emp.id]);
      } else {
        await client.query(
          `UPDATE "dayOrderEmployee" SET function=$1, name=$2, prevision=$3, arrival=$4, departure=$5,
           phone=$6, comments=$7 WHERE id=$8`,
          [emp.function||'', emp.name||'', emp.prevision||'', emp.arrival||'', emp.departure||'',
           emp.phone||'', emp.comments||'', emp.id]
        );
      }
    }
    await client.query(
      `UPDATE "dayOrder" SET comments=$1, "lastEditBy"=$2 WHERE id=$3`,
      [comments||'', lastEditBy||'', dayOrderId]
    );
    await client.query('COMMIT');
    res.json({ error: false });
  } catch (err) {
    await client.query('ROLLBACK');
    res.json({ error: true, message: err.message });
  } finally {
    client.release();
  }
});

// GET /day-order/delete-employee
router.get('/delete-employee', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM "dayOrderEmployeesList" WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /day-order/delete-function
router.get('/delete-function', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM "dayOrderEmployeesFunctions" WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /day-order/delete-remuneration
router.get('/delete-remuneration', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM "dayOrderEmployeesRemunerations" WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /day-order/edit-employee-option
router.post('/edit-employee-option', async (req, res) => {
  const { id, function: fn, type, name, phone } = req.body;
  try {
    await pool.query(
      `UPDATE "dayOrderEmployeesList" SET name=$1, function=$2, phone=$3, type=$4 WHERE id=$5`,
      [name||'', fn||'', phone||'', type||'', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /day-order/edit-function
router.post('/edit-function', async (req, res) => {
  const { id, name, orderNumber } = req.body;
  try {
    await pool.query(
      `UPDATE "dayOrderEmployeesFunctions" SET name=$1, "orderNumber"=$2 WHERE id=$3`,
      [name||'', orderNumber||0, id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /day-order/calculate-payments
router.post('/calculate-payments', async (req, res) => {
  const { dayOrderId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all employees for this day order (excluding Fixo type)
    const empRes = await client.query(
      `SELECT de.*, del.type as "empType"
       FROM "dayOrderEmployee" de
       LEFT JOIN "dayOrderEmployeesList" del ON del.name = de.name AND del.function = de.function
       WHERE de."dayOrderId" = $1 AND de.deleted = 0`,
      [dayOrderId]
    );

    const dayOrderRes = await client.query(`SELECT date FROM "dayOrder" WHERE id = $1`, [dayOrderId]);
    const dayDate = dayOrderRes.rows[0]?.date;

    await client.query(`DELETE FROM "dayOrderPayments" WHERE "dayOrderId" = $1`, [dayOrderId]);

    for (const emp of empRes.rows) {
      if (emp.empType === 'Fixo') continue;

      const payments = [];

      if (emp.function === 'Guia') {
        // Get tours where this guide participated
        const toursRes = await client.query(
          `SELECT DISTINCT "tourHour", activity FROM tour
           WHERE "dayOrderId" = $1 AND canceled = 0 AND "ceGuide" LIKE $2`,
          [dayOrderId, `%${emp.name}%`]
        );

        for (const tour of toursRes.rows) {
          // Get remuneration for Guide + activity
          const remRes = await client.query(
            `SELECT r."hourlyValue1" FROM "dayOrderEmployeesRemunerations" r
             INNER JOIN "dayOrderEmployeesFunctions" f ON f.id = r."functionId"
             WHERE f.name = 'Guia' AND r.activity = $1 LIMIT 1`,
            [tour.activity]
          );
          if (remRes.rows.length === 0) {
            throw new Error(`Não foi possível gerar os pagamentos pois a atividade ${tour.activity} não possui o salário cadastrado`);
          }
          payments.push({
            function: emp.function,
            employeeName: emp.name,
            arrival: emp.arrival || '',
            departure: emp.departure || '',
            value: remRes.rows[0].hourlyValue1,
            activity: tour.activity,
            tourHour: tour.tourHour,
          });
        }
      } else {
        // Get remuneration for this function
        const remRes = await client.query(
          `SELECT r.* FROM "dayOrderEmployeesRemunerations" r
           INNER JOIN "dayOrderEmployeesFunctions" f ON f.id = r."functionId"
           WHERE f.name = $1 LIMIT 1`,
          [emp.function]
        );
        if (remRes.rows.length === 0) {
          throw new Error(`Não foi possível gerar os pagamentos pois a função ${emp.function} não possui o salário cadastrado`);
        }
        const rem = remRes.rows[0];
        let value = 0;

        if (rem.paymentType === 'day') {
          // Calculate hours worked
          let hours = 0;
          if (emp.arrival && emp.departure) {
            const [ah, am] = emp.arrival.split(':').map(Number);
            const [dh, dm] = emp.departure.split(':').map(Number);
            hours = (dh * 60 + dm - (ah * 60 + am)) / 60;
          }
          if (hours <= 8) value = rem.hourlyValue1;
          else if (hours <= 10) value = rem.hourlyValue2;
          else value = rem.hourlyValue3;
        } else if (rem.paymentType === 'hour') {
          let hours = 0;
          if (emp.arrival && emp.departure) {
            const [ah, am] = emp.arrival.split(':').map(Number);
            const [dh, dm] = emp.departure.split(':').map(Number);
            hours = (dh * 60 + dm - (ah * 60 + am)) / 60;
          }
          value = parseFloat(rem.hourlyValue1) * hours;
        } else {
          value = 0; // special
        }

        payments.push({
          function: emp.function,
          employeeName: emp.name,
          arrival: emp.arrival || '',
          departure: emp.departure || '',
          value,
          activity: '',
          tourHour: '',
        });
      }

      for (const p of payments) {
        await client.query(
          `INSERT INTO "dayOrderPayments" ("dayOrderId", function, "employeeName", arrival, departure, value, comments, activity, "tourHour", "paymentDate")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
          [dayOrderId, p.function, p.employeeName, p.arrival, p.departure, p.value, '', p.activity, p.tourHour]
        );
      }
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

// POST /day-order/change-individual-payment
router.post('/change-individual-payment', async (req, res) => {
  const { paymentId, paymentNewValue } = req.body;
  try {
    await pool.query(`UPDATE "dayOrderPayments" SET value = $1 WHERE id = $2`, [paymentNewValue, paymentId]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/change-individual-comments
router.post('/change-individual-comments', async (req, res) => {
  const { paymentId, commentsNewValue } = req.body;
  try {
    await pool.query(`UPDATE "dayOrderPayments" SET comments = $1 WHERE id = $2`, [commentsNewValue, paymentId]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/split-tours-to-another-day-order
router.post('/split-tours-to-another-day-order', async (req, res) => {
  const { activity, hour, date, language, dayOrderId, editedBy } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dow = new Date(date + 'T00:00:00').getDay();
    const ins = await client.query(
      `INSERT INTO "dayOrder" (date, name, "weekDay", comments, "originalDayOrder", "lastEditBy")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [date, activity, String(dow), '', dayOrderId, editedBy||'']
    );
    const newDayOrderId = ins.rows[0].id;
    await client.query(
      `UPDATE tour SET "dayOrderId" = $1
       WHERE "tourDate" = $2 AND "tourHour" = $3 AND activity = $4 AND language = $5 AND canceled = 0`,
      [newDayOrderId, date, hour, activity, language]
    );
    await client.query('COMMIT');
    res.json({ error: false });
  } catch (err) {
    await client.query('ROLLBACK');
    res.json({ error: true, message: err.message });
  } finally {
    client.release();
  }
});

// POST /day-order/return-tour-to-original-day-order
router.post('/return-tour-to-original-day-order', async (req, res) => {
  const { activity, hour, date, language, dayOrderId } = req.body;
  try {
    const doRes = await pool.query(
      `SELECT "originalDayOrder" FROM "dayOrder" WHERE id = $1`, [dayOrderId]
    );
    let originalId = doRes.rows[0]?.originalDayOrder;
    if (!originalId) {
      // Try to find from regular tour on same date
      const tRes = await pool.query(
        `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 AND type = 'regular' LIMIT 1`, [date]
      );
      originalId = tRes.rows[0]?.dayOrderId;
    }
    if (!originalId) {
      const tRes = await pool.query(
        `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 LIMIT 1`, [date]
      );
      originalId = tRes.rows[0]?.dayOrderId;
    }
    await pool.query(
      `UPDATE tour SET "dayOrderId" = $1
       WHERE "tourDate" = $2 AND "tourHour" = $3 AND activity = $4 AND language = $5 AND canceled = 0`,
      [originalId, date, hour, activity, language]
    );
    res.json({ error: false, original: originalId });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /day-order/associate-guide-to-tour
router.post('/associate-guide-to-tour', async (req, res) => {
  const { guide, tourHour, activity, language, dayOrderId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM "dayOrderAssociateGuidesInTours"
       WHERE "dayOrderId" = $1 AND "tourHour" = $2 AND activity = $3 AND language = $4`,
      [dayOrderId, tourHour, activity, language]
    );
    const guides = Array.isArray(guide) ? guide : [guide];
    for (const g of guides) {
      await client.query(
        `INSERT INTO "dayOrderAssociateGuidesInTours" ("dayOrderId","tourHour",activity,language,guide)
         VALUES ($1,$2,$3,$4,$5)`,
        [dayOrderId, tourHour, activity, language, g]
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

module.exports = router;
