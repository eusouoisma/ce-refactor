const express = require('express');
const { pool, getCurrentYear, formatDate, getTodaySP } = require('../db');

const router = express.Router();

// Helper: get or create dayOrder for a date
async function getOrCreateDayOrder(client, tourDate) {
  const res = await client.query(
    `SELECT id FROM "dayOrder" WHERE date = $1 AND name = 'Tour Principal'`,
    [tourDate]
  );
  if (res.rows.length > 0) return res.rows[0].id;
  const dow = new Date(tourDate + 'T00:00:00').getDay();
  const ins = await client.query(
    `INSERT INTO "dayOrder" (date, name, "weekDay", comments) VALUES ($1, 'Tour Principal', $2, '') RETURNING id`,
    [tourDate, String(dow)]
  );
  return ins.rows[0].id;
}

// Helper: get dayOrder when date changes
async function getDayOrderForDateChange(client, tourDate) {
  let res = await client.query(
    `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 AND type = 'regular' LIMIT 1`,
    [tourDate]
  );
  if (res.rows.length > 0) return res.rows[0].dayOrderId;
  res = await client.query(
    `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 LIMIT 1`,
    [tourDate]
  );
  if (res.rows.length > 0) return res.rows[0].dayOrderId;
  const dow = new Date(tourDate + 'T00:00:00').getDay();
  const ins = await client.query(
    `INSERT INTO "dayOrder" (date, name, "weekDay", comments) VALUES ($1, 'Tour Principal', $2, '') RETURNING id`,
    [tourDate, String(dow)]
  );
  return ins.rows[0].id;
}

// Helper: generate orderRef
async function generateOrderRef(client) {
  const res = await client.query(
    `SELECT id, value FROM settings WHERE type = 'orderRefCount' LIMIT 1`
  );
  let count = parseInt(res.rows[0]?.value || '0') + 1;
  const padded = String(count).padStart(4, '0');
  await client.query(
    `UPDATE settings SET value = $1 WHERE type = 'orderRefCount'`,
    [String(count)]
  );
  return 'CE' + padded;
}

// isTourRegularAndDateNotPassed
function isTourRegularAndDateNotPassed(type, tourDate) {
  if (type !== 'regular') return false;
  const today = getTodaySP();
  return tourDate >= today;
}

// POST /tours/create
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentYear = await getCurrentYear();
    const d = req.body;

    let orderRef = d.orderRef || '';
    if (!orderRef) {
      orderRef = await generateOrderRef(client);
    }

    const tourDate = d.tourDate;
    const dayOrderId = await getOrCreateDayOrder(client, tourDate);

    const ceGuide = Array.isArray(d.ceGuide) ? d.ceGuide.join(',') : (d.ceGuide || '');
    const isHighSeason = d.isHighSeason ? '1' : '0';
    const commissioned = d.commissioned ? '1' : '0';

    const ins = await client.query(
      `INSERT INTO tour (type, "orderRef", platform, activity, adicional, duration, "tourDate", "tourHour",
       local, status, language, client, "paxAdult", "paxHalf", "paxFree", "paxNet", "paxBrazilian",
       currency, "paymentMethod", "totalValue", "numberOfGroups", "ceGuide", "clientName", "clientContact",
       country, "emailSubject", "companionName", "companionContact", commissioned, comments,
       "conversationHistory", "paymentStatus", "financialComments", year, "dateOfRegistration",
       "createdBy", "lastEditBy", origin, "dayOrderId", "isHighSeason")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
               $25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40)
       RETURNING id`,
      [
        d.type, orderRef, d.platform || '', d.activity || '', d.adicional || '',
        d.duration || '', tourDate, d.tourHour || '', d.local || '', d.status || '',
        d.language || '', d.client || '', d.paxAdult || 0, d.paxHalf || 0,
        d.paxFree || 0, d.paxNet || 0, d.paxBrazilian || 0, d.currency || '',
        d.paymentMethod || '', d.totalValue || '', d.numberOfGroups || 0,
        ceGuide, d.clientName || '', d.clientContact || '', d.country || '',
        d.emailSubject || '', d.companionName || '', d.companionContact || '',
        commissioned, d.comments || '', d.conversationHistory || '',
        d.paymentStatus || '', '', currentYear, d.dateOfRegistration || null,
        d.createdBy || '', d.lastEditBy || '', 'office', dayOrderId, isHighSeason,
      ]
    );
    const tourId = ins.rows[0].id;

    if (commissioned === '1') {
      const comissionPaid = d.comissionPaid ? '1' : '0';
      await client.query(
        `INSERT INTO comissions ("tourId", "orderRef", "comissionersName", "comissionersContact",
         "comissionCurrency", "comissionPrice", "comissionPaid", "createdBy", "lastEditBy",
         year, "dateOfRegistration")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [tourId, orderRef, d.comissionersName || '', d.comissionersContact || '',
         d.comissionCurrency || '', d.comissionPrice || '', comissionPaid,
         d.createdBy || '', d.lastEditBy || '', currentYear, d.dateOfRegistration || null]
      );
    }

    // Auto-create customer/contact
    const custRes = await client.query(
      `SELECT id FROM customers WHERE "customerName" = $1`, [d.client]
    );
    let customerId;
    if (custRes.rows.length === 0) {
      const custIns = await client.query(
        `INSERT INTO customers ("customerName", "customerType", "createdBy", "lastEditBy") VALUES ($1,$2,$3,$4) RETURNING id`,
        [d.client || '', d.newCustomerType || '', d.createdBy || '', d.lastEditBy || '']
      );
      customerId = custIns.rows[0].id;
      await client.query(
        `INSERT INTO "customerContacts" ("customerId", "contactName", "contactContact", "contactOffice", "contactEmail", "createdBy", "lastEditBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [customerId, d.clientName || '', '', '', d.clientContact || '', d.createdBy || '', d.lastEditBy || '']
      );
    } else {
      customerId = custRes.rows[0].id;
      const contactRes = await client.query(
        `SELECT cc.id FROM customers c INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
         WHERE c."customerName" = $1 AND cc."contactName" = $2`,
        [d.client, d.clientName || '']
      );
      if (contactRes.rows.length === 0) {
        await client.query(
          `INSERT INTO "customerContacts" ("customerId", "contactName", "contactContact", "contactOffice", "contactEmail", "createdBy", "lastEditBy")
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [customerId, d.clientName || '', '', '', d.clientContact || '', d.createdBy || '', d.lastEditBy || '']
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

// POST /tours/update (with ?id= query param)
router.post('/update', async (req, res) => {
  const id = req.query.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentYear = await getCurrentYear();
    const d = req.body;

    const tourRes = await client.query(
      `SELECT "tourDate", "dayOrderId" FROM tour WHERE id = $1`, [id]
    );
    const current = tourRes.rows[0];
    const currentTourDate = current.tourDate ? new Date(current.tourDate).toISOString().split('T')[0] : '';
    const tourDate = d.tourDate;

    let dayOrderId;
    if (tourDate !== currentTourDate) {
      dayOrderId = await getDayOrderForDateChange(client, tourDate);
    } else {
      dayOrderId = current.dayOrderId;
    }

    const ceGuide = Array.isArray(d.ceGuide) ? d.ceGuide.join(',') : (d.ceGuide || '');
    const isHighSeason = d.isHighSeason ? '1' : '0';
    const commissioned = d.commissioned ? '1' : '0';
    const includeFinancial = isTourRegularAndDateNotPassed(d.type, tourDate);

    if (includeFinancial) {
      await client.query(
        `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, duration=$6,
         "tourDate"=$7, "tourHour"=$8, local=$9, status=$10, language=$11, "paxAdult"=$12, "paxHalf"=$13,
         "paxFree"=$14, "paxNet"=$15, "paxBrazilian"=$16, "numberOfGroups"=$17, "ceGuide"=$18, client=$19,
         "clientName"=$20, "clientContact"=$21, country=$22, "emailSubject"=$23, "companionName"=$24,
         "companionContact"=$25, commissioned=$26, comments=$27, "conversationHistory"=$28,
         "lastEditBy"=$29, "dayOrderId"=$30, currency=$31, "paymentMethod"=$32, "totalValue"=$33,
         "isHighSeason"=$34
         WHERE id=$35`,
        [d.type, d.orderRef||'', d.platform||'', d.activity||'', d.adicional||'', d.duration||'',
         tourDate, d.tourHour||'', d.local||'', d.status||'', d.language||'',
         d.paxAdult||0, d.paxHalf||0, d.paxFree||0, d.paxNet||0, d.paxBrazilian||0,
         d.numberOfGroups||0, ceGuide, d.client||'', d.clientName||'', d.clientContact||'',
         d.country||'', d.emailSubject||'', d.companionName||'', d.companionContact||'',
         commissioned, d.comments||'', d.conversationHistory||'', d.lastEditBy||'',
         dayOrderId, d.currency||'', d.paymentMethod||'', d.totalValue||'', isHighSeason, id]
      );
    } else {
      await client.query(
        `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, duration=$6,
         "tourDate"=$7, "tourHour"=$8, local=$9, status=$10, language=$11, "paxAdult"=$12, "paxHalf"=$13,
         "paxFree"=$14, "paxNet"=$15, "paxBrazilian"=$16, "numberOfGroups"=$17, "ceGuide"=$18, client=$19,
         "clientName"=$20, "clientContact"=$21, country=$22, "emailSubject"=$23, "companionName"=$24,
         "companionContact"=$25, commissioned=$26, comments=$27, "conversationHistory"=$28,
         "lastEditBy"=$29, "dayOrderId"=$30, "isHighSeason"=$31
         WHERE id=$32`,
        [d.type, d.orderRef||'', d.platform||'', d.activity||'', d.adicional||'', d.duration||'',
         tourDate, d.tourHour||'', d.local||'', d.status||'', d.language||'',
         d.paxAdult||0, d.paxHalf||0, d.paxFree||0, d.paxNet||0, d.paxBrazilian||0,
         d.numberOfGroups||0, ceGuide, d.client||'', d.clientName||'', d.clientContact||'',
         d.country||'', d.emailSubject||'', d.companionName||'', d.companionContact||'',
         commissioned, d.comments||'', d.conversationHistory||'', d.lastEditBy||'',
         dayOrderId, isHighSeason, id]
      );
    }

    // Delete and re-insert changeRequests
    await client.query(`DELETE FROM "changeRequests" WHERE "tourId" = $1`, [id]);
    const changeRequests = d.changeRequests || [];
    for (const cr of changeRequests) {
      await client.query(
        `INSERT INTO "changeRequests" (type, name, "oldValue", "newValue", "tourId", "createdBy")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [cr.type||'', cr.name||'', cr.oldValue||'', cr.newValue||'', id, d.lastEditBy||'']
      );
    }

    // Commission
    if (commissioned === '1') {
      const comissionPaid = d.comissionPaid ? '1' : '0';
      if (d.commissionId) {
        const cRes = await client.query(`SELECT id FROM comissions WHERE id = $1`, [d.commissionId]);
        if (cRes.rows.length === 0) {
          await client.query(
            `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [id, d.orderRef||'', d.comissionersName||'', d.comissionersContact||'',
             d.comissionCurrency||'', d.comissionPrice||'', comissionPaid,
             d.lastEditBy||'', d.lastEditBy||'', currentYear, d.dateOfRegistration||null]
          );
        } else {
          await client.query(
            `UPDATE comissions SET "comissionersName"=$1,"comissionersContact"=$2,"comissionCurrency"=$3,
             "comissionPrice"=$4,"comissionPaid"=$5,"lastEditBy"=$6 WHERE id=$7`,
            [d.comissionersName||'', d.comissionersContact||'', d.comissionCurrency||'',
             d.comissionPrice||'', comissionPaid, d.lastEditBy||'', d.commissionId]
          );
        }
      } else {
        await client.query(
          `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [id, d.orderRef||'', d.comissionersName||'', d.comissionersContact||'',
           d.comissionCurrency||'', d.comissionPrice||'', comissionPaid,
           d.lastEditBy||'', d.lastEditBy||'', currentYear, d.dateOfRegistration||null]
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

// GET /tours/list-all
router.get('/list-all', async (req, res) => {
  try {
    const { months, year } = req.query;
    const currentYear = await getCurrentYear();
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 3}`).join(',');

    const sql = `
      SELECT t.*,
        CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
        EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
        EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
      FROM tour t
      LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
      WHERE t.year = $1
        AND EXTRACT(YEAR FROM t."tourDate") = $2
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.canceled = 0
        AND t.origin = 'office'
      ORDER BY t."tourDate" ASC, t."tourHour" ASC
    `;
    const result = await pool.query(sql, [currentYear, year, ...monthsArr]);
    const rows = result.rows.map(r => ({
      ...r,
      formatedTourDate: formatDate(r.tourDate),
      dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
      formatedPaymentDate: formatDate(r.paymentDate),
    }));
    res.json(rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /tours/list-all-financial
router.get('/list-all-financial', async (req, res) => {
  try {
    const { months, year } = req.query;
    const currentYear = await getCurrentYear();
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 3}`).join(',');

    const sql = `
      SELECT t.*,
        CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
        EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
        EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
      FROM tour t
      LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
      WHERE t.year = $1
        AND EXTRACT(YEAR FROM t."tourDate") = $2
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.canceled = 0
      ORDER BY t."tourDate" ASC, t."tourHour" ASC
    `;
    const result = await pool.query(sql, [currentYear, year, ...monthsArr]);
    const rows = result.rows.map(r => ({
      ...r,
      formatedTourDate: formatDate(r.tourDate),
      dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
      formatedPaymentDate: formatDate(r.paymentDate),
    }));
    res.json(rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /tours/list-all-summary
router.get('/list-all-summary', async (req, res) => {
  try {
    const { months, year } = req.query;
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 1}`).join(',');

    // Non-regular tours grouped by id
    const nonRegularSql = `
      SELECT t.id, t.status, t."tourDate", t."tourHour", t.type, t.activity, t.duration, t.language,
             t."ceGuide" as guides, (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
             (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotalInitial",
             t.client, t."numberOfGroups" as groups
      FROM tour t
      WHERE EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND EXTRACT(YEAR FROM t."tourDate") = $${monthsArr.length + 1}
        AND t.canceled = 0
        AND t.origin = 'office'
        AND t."tourHour" != ''
        AND t.type != 'regular'
    `;

    // Regular tours grouped by date/hour/activity
    const regularSql = `
      SELECT MIN(t.id) as id, t.status, t."tourDate", t."tourHour", t.type, t.activity, t.duration, t.language,
             STRING_AGG(DISTINCT t."ceGuide", ',') as guides,
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotalInitial",
             STRING_AGG(DISTINCT t.client, ', ') as client,
             COALESCE(ng.groups, 0) as groups
      FROM tour t
      LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
      WHERE EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND EXTRACT(YEAR FROM t."tourDate") = $${monthsArr.length + 1}
        AND t.canceled = 0
        AND t.origin = 'office'
        AND t."tourHour" != ''
        AND t.type = 'regular'
      GROUP BY t."tourDate", t."tourHour", t.activity, t.status, t.type, t.duration, t.language, ng.groups
    `;

    const params = [...monthsArr, year];
    const [nonRegular, regular] = await Promise.all([
      pool.query(nonRegularSql, params),
      pool.query(regularSql, params),
    ]);

    const combined = [...nonRegular.rows, ...regular.rows]
      .sort((a, b) => {
        if (a.tourDate < b.tourDate) return -1;
        if (a.tourDate > b.tourDate) return 1;
        return (a.tourHour || '') < (b.tourHour || '') ? -1 : 1;
      })
      .map(r => {
        // Deduplicate guides
        const guides = r.guides
          ? [...new Set(r.guides.split(',').map(g => g.trim()).filter(Boolean))].join(',')
          : '';
        return { ...r, guides, formatedTourDate: formatDate(r.tourDate) };
      });

    res.json(combined);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /tours/list-by-id
router.get('/list-by-id', async (req, res) => {
  try {
    const { tour_id } = req.query;
    const tourRes = await pool.query(
      `SELECT t.*, c.id as "commissionId", c."comissionersName", c."comissionersContact",
              c."comissionCurrency", c."comissionPrice", c."comissionPaid"
       FROM tour t
       LEFT JOIN comissions c ON c."tourId" = t.id AND c.deleted = 0
       WHERE t.id = $1`,
      [tour_id]
    );
    if (tourRes.rows.length === 0) return res.json({ error: true, message: 'Not found' });
    const tour = tourRes.rows[0];
    const crRes = await pool.query(
      `SELECT * FROM "changeRequests" WHERE "tourId" = $1`, [tour_id]
    );
    tour.changeRequests = crRes.rows;
    res.json(tour);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /tours/list-canceled
router.get('/list-canceled', async (req, res) => {
  try {
    const { months, year } = req.query;
    const currentYear = await getCurrentYear();
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 3}`).join(',');
    const sql = `
      SELECT t.*,
        EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests"
      FROM tour t
      WHERE t.year = $1
        AND EXTRACT(YEAR FROM t."tourDate") = $2
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.canceled = 1
      ORDER BY t."tourDate" ASC
    `;
    const result = await pool.query(sql, [currentYear, year, ...monthsArr]);
    res.json(result.rows.map(r => ({ ...r, formatedTourDate: formatDate(r.tourDate) })));
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /tours/cancel (with ?id= query param)
router.post('/cancel', async (req, res) => {
  const { id } = req.query;
  const { cancelReason, lastEditBy } = req.body;
  try {
    await pool.query(
      `UPDATE tour SET canceled = 1, "cancelReason" = $1, "lastEditBy" = $2 WHERE id = $3`,
      [cancelReason || '', lastEditBy || '', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /tours/cancel-multiple (with ?ids= query param)
router.post('/cancel-multiple', async (req, res) => {
  const { ids } = req.query;
  const { cancelReason, lastEditBy } = req.body;
  try {
    const idArr = ids.split(',').map(Number);
    const placeholders = idArr.map((_, i) => `$${i + 3}`).join(',');
    const result = await pool.query(
      `UPDATE tour SET canceled = 1, "cancelReason" = $1, "lastEditBy" = $2
       WHERE id IN (${placeholders}) RETURNING id`,
      [cancelReason || '', lastEditBy || '', ...idArr]
    );
    res.json({
      error: false,
      affectedRows: result.rowCount,
      canceledIds: result.rows.map(r => r.id),
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /tours/uncancel (with ?id= query param)
router.post('/uncancel', async (req, res) => {
  const { id } = req.query;
  const { lastEditBy } = req.body;
  try {
    await pool.query(
      `UPDATE tour SET canceled = 0, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /tours/create-financial
router.post('/create-financial', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentYear = await getCurrentYear();
    const d = req.body;

    let orderRef = d.orderRef || '';
    if (!orderRef) {
      orderRef = await generateOrderRef(client);
    }

    const tourDate = d.tourDate;
    const dayOrderId = await getOrCreateDayOrder(client, tourDate);
    const isHighSeason = d.isHighSeason ? '1' : '0';
    const commissioned = d.commissioned ? '1' : '0';

    const ins = await client.query(
      `INSERT INTO tour (type, "orderRef", platform, activity, adicional, "tourDate", "tourHour",
       status, "paymentStatus", client, "clientName", "clientContact", "paymentMethod", currency,
       "totalValue", "netValue", "financialComments", company, "invoiceNumber", "accountNumber",
       "paymentDate", "isHighSeason", commissioned, "dateOfRegistration", "createdBy", "lastEditBy",
       origin, "dayOrderId", year, "conversationHistory", "comments")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
       RETURNING id`,
      [
        d.type||'regular', orderRef, d.platform||'', d.activity||'', d.adicional||'',
        tourDate, d.tourHour||'', d.status||'', d.paymentStatus||'',
        d.client||'', d.clientName||'', d.clientContact||'',
        d.paymentMethod||'', d.currency||'', d.totalValue||'',
        d.netValue||0, d.financialComments||'', d.company||'',
        d.invoiceNumber||'', d.accountNumber||'',
        d.paymentDate||null, isHighSeason, commissioned,
        d.dateOfRegistration||null, d.createdBy||'', d.lastEditBy||'',
        'financial', dayOrderId, currentYear, d.conversationHistory||'', d.comments||''
      ]
    );
    const tourId = ins.rows[0].id;

    if (commissioned === '1') {
      const comissionPaid = d.comissionPaid ? '1' : '0';
      await client.query(
        `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [tourId, orderRef, d.comissionersName||'', d.comissionersContact||'',
         d.comissionCurrency||'', d.comissionPrice||'', comissionPaid,
         d.createdBy||'', d.lastEditBy||'', currentYear, d.dateOfRegistration||null]
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

// POST /tours/update-financial (with ?id=)
router.post('/update-financial', async (req, res) => {
  const id = req.query.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentYear = await getCurrentYear();
    const d = req.body;

    const tourRes = await client.query(`SELECT "tourDate","dayOrderId" FROM tour WHERE id = $1`, [id]);
    const current = tourRes.rows[0];
    const currentTourDate = current.tourDate ? new Date(current.tourDate).toISOString().split('T')[0] : '';
    const tourDate = d.tourDate;

    let dayOrderId;
    if (tourDate !== currentTourDate) {
      dayOrderId = await getDayOrderForDateChange(client, tourDate);
    } else {
      dayOrderId = current.dayOrderId;
    }

    const isHighSeason = d.isHighSeason ? '1' : '0';
    const commissioned = d.commissioned ? '1' : '0';

    await client.query(
      `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, "tourDate"=$6,
       "tourHour"=$7, status=$8, "paymentStatus"=$9, client=$10, "clientName"=$11, "clientContact"=$12,
       "paymentMethod"=$13, currency=$14, "totalValue"=$15, "netValue"=$16, "financialComments"=$17,
       company=$18, "invoiceNumber"=$19, "accountNumber"=$20, "paymentDate"=$21, "isHighSeason"=$22,
       commissioned=$23, "lastEditBy"=$24, "dayOrderId"=$25, comments=$26, "conversationHistory"=$27
       WHERE id=$28`,
      [
        d.type||'regular', d.orderRef||'', d.platform||'', d.activity||'', d.adicional||'',
        tourDate, d.tourHour||'', d.status||'', d.paymentStatus||'',
        d.client||'', d.clientName||'', d.clientContact||'',
        d.paymentMethod||'', d.currency||'', d.totalValue||'',
        d.netValue||0, d.financialComments||'', d.company||'',
        d.invoiceNumber||'', d.accountNumber||'',
        d.paymentDate||null, isHighSeason, commissioned,
        d.lastEditBy||'', dayOrderId, d.comments||'', d.conversationHistory||'', id
      ]
    );

    // Handle changeRequests (approve/reprove)
    const changeRequests = d.changeRequests || [];
    await client.query(`DELETE FROM "changeRequests" WHERE "tourId" = $1`, [id]);
    for (const cr of changeRequests) {
      if (cr.approved) {
        await client.query(
          `UPDATE tour SET "${cr.type}" = $1 WHERE id = $2`,
          [cr.newValue, id]
        );
      }
      // Only re-insert if not approved/reproved (pending)
      if (!cr.approved && !cr.reproved) {
        await client.query(
          `INSERT INTO "changeRequests" (type, name, "oldValue", "newValue", "tourId", "createdBy")
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [cr.type||'', cr.name||'', cr.oldValue||'', cr.newValue||'', id, d.lastEditBy||'']
        );
      }
    }

    // Commission
    if (commissioned === '1') {
      const comissionPaid = d.comissionPaid ? '1' : '0';
      if (d.commissionId) {
        const cRes = await client.query(`SELECT id FROM comissions WHERE id = $1`, [d.commissionId]);
        if (cRes.rows.length === 0) {
          await client.query(
            `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [id, d.orderRef||'', d.comissionersName||'', d.comissionersContact||'',
             d.comissionCurrency||'', d.comissionPrice||'', comissionPaid,
             d.lastEditBy||'', d.lastEditBy||'', currentYear, d.dateOfRegistration||null]
          );
        } else {
          await client.query(
            `UPDATE comissions SET "comissionersName"=$1,"comissionersContact"=$2,"comissionCurrency"=$3,
             "comissionPrice"=$4,"comissionPaid"=$5,"lastEditBy"=$6 WHERE id=$7`,
            [d.comissionersName||'', d.comissionersContact||'', d.comissionCurrency||'',
             d.comissionPrice||'', comissionPaid, d.lastEditBy||'', d.commissionId]
          );
        }
      } else {
        await client.query(
          `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [id, d.orderRef||'', d.comissionersName||'', d.comissionersContact||'',
           d.comissionCurrency||'', d.comissionPrice||'', comissionPaid,
           d.lastEditBy||'', d.lastEditBy||'', currentYear, d.dateOfRegistration||null]
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

// GET /tours/available-hours
router.get('/available-hours', async (req, res) => {
  const { date, type, status } = req.query;
  try {
    const result = await pool.query(
      `SELECT DISTINCT "tourHour" FROM tour WHERE "tourDate" = $1 AND type = $2 AND status = $3 AND canceled = 0 ORDER BY "tourHour" ASC`,
      [date, type, status]
    );
    res.json(result.rows.map(r => r.tourHour));
  } catch (err) {
    res.json([]);
  }
});

// GET /tours/list-clients-by-date-and-hour
router.get('/list-clients-by-date-and-hour', async (req, res) => {
  const { date, hour } = req.query;
  try {
    const result = await pool.query(
      `SELECT client, "companionName", "companionContact" FROM tour
       WHERE "tourDate" = $1 AND "tourHour" = $2 AND status != 'Cancelado' AND canceled = 0`,
      [date, hour]
    );
    res.json({ error: false, clients: result.rows });
  } catch (err) {
    res.json({ error: true, clients: [] });
  }
});

// POST /tours/mark-as-late-check (with ?id=)
router.post('/mark-as-late-check', async (req, res) => {
  const { id } = req.query;
  const { lastEditBy } = req.body;
  try {
    await pool.query(
      `UPDATE tour SET "lateCheck" = 1, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /tours/regular-list
router.get('/regular-list', async (req, res) => {
  const { date, hour } = req.query;
  try {
    const result = await pool.query(
      `SELECT t.*, ROW_NUMBER() OVER (ORDER BY t.client) as n
       FROM tour t
       WHERE "tourDate" = $1 AND "tourHour" = $2 AND status = 'Confirmado' AND type = 'regular' AND canceled = 0
       ORDER BY client ASC`,
      [date, hour]
    );
    const rows = result.rows.map(r => ({
      n: r.n,
      guideAgency: r.client,
      adulto: r.paxAdult,
      net: r.paxNet,
      brasileiro: r.paxBrazilian,
      meia: r.paxHalf,
      free: r.paxFree,
      total: (parseInt(r.paxAdult)||0) + (parseInt(r.paxNet)||0) + (parseInt(r.paxBrazilian)||0) + (parseInt(r.paxHalf)||0) + (parseInt(r.paxFree)||0),
      nomePax: r.clientName,
      guia: r.companionName,
      paymentMethod: r.paymentMethod,
      valorTotal: r.totalValue,
      comissao: r.commissioned == 1 ? 'Sim' : 'Não',
      statusPgto: r.paymentStatus,
      obs: r.comments,
    }));
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
