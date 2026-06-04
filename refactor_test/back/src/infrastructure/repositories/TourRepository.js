const { formatDate } = require('../../shared/db');

const FILTERABLE_TOUR_COLS = {
  status:           't.status',
  formatedTourDate: "TO_CHAR(t.\"tourDate\", 'DD/MM/YYYY')",
  tourHour:         't."tourHour"',
  activity:         't.activity',
  adicional:        't.adicional',
  language:         't.language',
  client:           't.client',
  orderRef:         't."orderRef"',
  ceGuide:          't."ceGuide"',
  currency:         't.currency',
  paymentMethod:    't."paymentMethod"',
  paymentStatus:    't."paymentStatus"',
  companionName:    't."companionName"',
  local:            't.local',
  platform:         't.platform',
  country:          't.country',
};

const FILTERABLE_SUMMARY_COLS = {
  formatedTourDate: "TO_CHAR(t.\"tourDate\", 'DD/MM/YYYY')",
  tourHour:  't."tourHour"',
  activity:  't.activity',
  adicional: 't.adicional',
  language:  't.language',
  status:    't.status',
  client:    't.client',
  guides:    't."ceGuide"',
};

const FILTERABLE_FINANCIAL_COLS = {
  company:             't.company',
  invoiceNumber:       't."invoiceNumber"',
  status:              't.status',
  paymentStatus:       't."paymentStatus"',
  accountNumber:       't."accountNumber"',
  formatedPaymentDate: "TO_CHAR(t.\"paymentDate\", 'DD/MM/YYYY')",
  formatedTourDate:    "TO_CHAR(t.\"tourDate\", 'DD/MM/YYYY')",
  tourHour:            't."tourHour"',
  activity:            't.activity',
  client:              't.client',
  platform:            't.platform',
  orderRef:            't."orderRef"',
  paymentMethod:       't."paymentMethod"',
  currency:            't.currency',
};

class TourRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  _buildColClause(dbCol, values, params) {
    const hasBlank  = values.includes('__VAZIO__');
    const nonBlank  = values.filter(v => v !== '__VAZIO__');
    const blankSQL  = `COALESCE(${dbCol}, '') = ''`;
    if (hasBlank && nonBlank.length > 0) {
      const ph = nonBlank.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...nonBlank);
      return `(${dbCol} IN (${ph}) OR ${blankSQL})`;
    }
    if (hasBlank) return blankSQL;
    const ph = nonBlank.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...nonBlank);
    return `${dbCol} IN (${ph})`;
  }

  _buildFilterClauses(filters, whitelist, params) {
    const clauses = [];
    for (const [key, rawVal] of Object.entries(filters || {})) {
      if (!key.startsWith('f_')) continue;
      const colKey = key.slice(2);
      const dbCol = whitelist[colKey];
      if (!dbCol) continue;
      const values = decodeURIComponent(rawVal).split('|').map(v => v.trim()).filter(v => v !== '');
      if (!values.length) continue;
      clauses.push(this._buildColClause(dbCol, values, params));
    }
    return clauses;
  }

  async insert(t, year, dayOrderId, tx, planneId = null) {
    const db = this._db(tx);
    const res = await db.query(
      `INSERT INTO tour (type, "orderRef", platform, activity, adicional, duration, "tourDate", "tourHour",
       local, status, language, client, "paxAdult", "paxHalf", "paxFree", "paxNet", "paxBrazilian",
       currency, "paymentMethod", "totalValue", "numberOfGroups", "ceGuide", "clientName", "clientContact",
       country, "emailSubject", "companionName", "companionContact", commissioned, comments,
       "conversationHistory", "paymentStatus", "financialComments", year, "dateOfRegistration",
       "createdBy", "lastEditBy", origin, "dayOrderId", "isHighSeason", "planneId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
               $25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41)
       RETURNING id`,
      [
        t.type, t.orderRef, t.platform, t.activity, t.adicional, t.duration,
        t.tourDate, t.tourHour, t.local, t.status, t.language, t.client,
        t.paxAdult, t.paxHalf, t.paxFree, t.paxNet, t.paxBrazilian,
        t.currency, t.paymentMethod, t.totalValue, t.numberOfGroups, t.ceGuide,
        t.clientName, t.clientContact, t.country, t.emailSubject,
        t.companionName, t.companionContact, t.commissioned, t.comments,
        t.conversationHistory, t.paymentStatus, '', year, t.dateOfRegistration,
        t.createdBy, t.lastEditBy, 'office', dayOrderId, t.isHighSeason, planneId || null,
      ]
    );
    return res.rows[0].id;
  }

  async update(id, t, dayOrderId, includeFinancial, tx) {
    const db = this._db(tx);
    if (includeFinancial) {
      await db.query(
        `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, duration=$6,
         "tourDate"=$7, "tourHour"=$8, local=$9, status=$10, language=$11, "paxAdult"=$12, "paxHalf"=$13,
         "paxFree"=$14, "paxNet"=$15, "paxBrazilian"=$16, "numberOfGroups"=$17, "ceGuide"=$18, client=$19,
         "clientName"=$20, "clientContact"=$21, country=$22, "emailSubject"=$23, "companionName"=$24,
         "companionContact"=$25, commissioned=$26, comments=$27, "conversationHistory"=$28,
         "lastEditBy"=$29, "dayOrderId"=$30, currency=$31, "paymentMethod"=$32, "totalValue"=$33,
         "isHighSeason"=$34
         WHERE id=$35`,
        [
          t.type, t.orderRef, t.platform, t.activity, t.adicional, t.duration,
          t.tourDate, t.tourHour, t.local, t.status, t.language,
          t.paxAdult, t.paxHalf, t.paxFree, t.paxNet, t.paxBrazilian,
          t.numberOfGroups, t.ceGuide, t.client, t.clientName, t.clientContact,
          t.country, t.emailSubject, t.companionName, t.companionContact,
          t.commissioned, t.comments, t.conversationHistory, t.lastEditBy,
          dayOrderId, t.currency, t.paymentMethod, t.totalValue, t.isHighSeason, id,
        ]
      );
    } else {
      await db.query(
        `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, duration=$6,
         "tourDate"=$7, "tourHour"=$8, local=$9, status=$10, language=$11, "paxAdult"=$12, "paxHalf"=$13,
         "paxFree"=$14, "paxNet"=$15, "paxBrazilian"=$16, "numberOfGroups"=$17, "ceGuide"=$18, client=$19,
         "clientName"=$20, "clientContact"=$21, country=$22, "emailSubject"=$23, "companionName"=$24,
         "companionContact"=$25, commissioned=$26, comments=$27, "conversationHistory"=$28,
         "lastEditBy"=$29, "dayOrderId"=$30, "isHighSeason"=$31
         WHERE id=$32`,
        [
          t.type, t.orderRef, t.platform, t.activity, t.adicional, t.duration,
          t.tourDate, t.tourHour, t.local, t.status, t.language,
          t.paxAdult, t.paxHalf, t.paxFree, t.paxNet, t.paxBrazilian,
          t.numberOfGroups, t.ceGuide, t.client, t.clientName, t.clientContact,
          t.country, t.emailSubject, t.companionName, t.companionContact,
          t.commissioned, t.comments, t.conversationHistory, t.lastEditBy,
          dayOrderId, t.isHighSeason, id,
        ]
      );
    }
  }

  async findById(id) {
    const res = await this.pool.query(
      `SELECT t.*, c.id as "commissionId", c."comissionersName", c."comissionersContact",
              c."comissionCurrency", c."comissionPrice", c."comissionPaid"
       FROM tour t
       LEFT JOIN comissions c ON c."tourId" = t.id AND c.deleted = 0
       WHERE t.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async existsByOrderRef(orderRef, tx) {
    const db = this._db(tx);
    const res = await db.query(`SELECT 1 FROM tour WHERE "orderRef" = $1 LIMIT 1`, [orderRef]);
    return res.rowCount > 0;
  }

  async findCurrentState(id, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT "tourDate", "dayOrderId" FROM tour WHERE id = $1`, [id]
    );
    return res.rows[0] || null;
  }

  async findAllForDiff(id, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT "type","orderRef","platform","activity","adicional","duration",
              "tourDate","tourHour","local","status","language",
              "client","clientName","clientContact","country",
              "paxAdult","paxHalf","paxFree","paxNet","paxBrazilian",
              "currency","paymentMethod","paymentStatus","totalValue","netValue",
              "numberOfGroups","ceGuide","companionName","companionContact",
              "emailSubject","commissioned","comments","conversationHistory","isHighSeason",
              "financialComments","company","invoiceNumber","accountNumber","paymentDate"
       FROM tour WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findAll(year, months, filters) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const params = [year, ...monthsArr];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_TOUR_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';

    const res = await this.pool.query(
      `SELECT t.*,
         CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
         EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
         EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
       FROM tour t
       LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
       WHERE EXTRACT(YEAR FROM t."tourDate") = $1
         AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
         AND t.canceled = 0
         AND t.origin = 'office'
         ${filterSQL}
       ORDER BY t."tourDate" ASC, t."tourHour" ASC`,
      params
    );
    return res.rows.map(r => ({
      ...r,
      formatedTourDate:           formatDate(r.tourDate),
      dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
      formatedPaymentDate:        formatDate(r.paymentDate),
    }));
  }

  async findAllFinancial(year, months, filters) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const params = [year, ...monthsArr];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_FINANCIAL_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n      AND ') : '';

    const res = await this.pool.query(
      `SELECT t.*,
         CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
         EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
         EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
       FROM tour t
       LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
       WHERE EXTRACT(YEAR FROM t."tourDate") = $1
         AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
         AND t.canceled = 0
         ${filterSQL}
       ORDER BY t."tourDate" ASC, t."tourHour" ASC`,
      params
    );
    return res.rows.map(r => ({
      ...r,
      formatedTourDate:           formatDate(r.tourDate),
      dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
      formatedPaymentDate:        formatDate(r.paymentDate),
    }));
  }

  async findAllSummary(months, year) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 1}`).join(',');
    const params = [...monthsArr, year];

    const nonRegularSql = `
      SELECT t.id, t.status, t."tourDate", t."tourHour", t.type, t.activity, t.adicional, t.duration, t.language,
             t."ceGuide" as guides, (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
             (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotalInitial",
             t.client, t."numberOfGroups" as groups, t.comments
      FROM tour t
      WHERE EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND EXTRACT(YEAR FROM t."tourDate") = $${monthsArr.length + 1}
        AND t.canceled = 0 AND t.origin = 'office' AND t."tourHour" != '' AND t.type != 'regular'
    `;
    const regularSql = `
      SELECT MIN(t.id) as id, t.status, t."tourDate", t."tourHour", t.type, t.activity,
             COALESCE(STRING_AGG(DISTINCT NULLIF(t.adicional, ''), ', '), '') as adicional,
             t.duration, t.language,
             STRING_AGG(DISTINCT t."ceGuide", ',') as guides,
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotalInitial",
             STRING_AGG(DISTINCT t.client, ', ') as client,
             COALESCE(ng.groups, 0) as groups,
             STRING_AGG(DISTINCT NULLIF(t.comments, ''), E'\\n---\\n') as comments
      FROM tour t
      LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
      WHERE EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND EXTRACT(YEAR FROM t."tourDate") = $${monthsArr.length + 1}
        AND t.canceled = 0 AND t.origin = 'office' AND t."tourHour" != '' AND t.type = 'regular'
      GROUP BY t."tourDate", t."tourHour", t.activity, t.status, t.type, t.duration, t.language, ng.groups
    `;

    const [nr, r] = await Promise.all([
      this.pool.query(nonRegularSql, params),
      this.pool.query(regularSql, params),
    ]);
    return [...nr.rows, ...r.rows];
  }

  async findAllSummaryPaginated(months, year, filters = {}, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    if (!monthsArr.length) return { rows: [], total: 0, totals: { paxTotal: 0 } };

    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const params = [year, ...monthsArr];
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_SUMMARY_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';

    const baseWhere = `
      EXTRACT(YEAR FROM t."tourDate") = $1
      AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
      AND t.canceled = 0 AND t.origin = 'office' AND t."tourHour" != ''
      ${filterSQL}`;

    const nonRegularSql = `
      SELECT t.id, t.status, t."tourDate", t."tourHour", t.type, t.activity,
             t.adicional, t.duration, t.language,
             t."ceGuide" AS guides,
             (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") AS "paxTotal",
             (t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") AS "paxTotalInitial",
             t.client, t."numberOfGroups" AS groups, t.comments
      FROM tour t
      WHERE ${baseWhere} AND t.type != 'regular'`;

    const regularSql = `
      SELECT MIN(t.id) AS id, t.status, t."tourDate", t."tourHour", t.type, t.activity,
             COALESCE(STRING_AGG(DISTINCT NULLIF(t.adicional, ''), ', '), '') AS adicional,
             t.duration, t.language,
             STRING_AGG(DISTINCT t."ceGuide", ',') AS guides,
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") AS "paxTotal",
             SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") AS "paxTotalInitial",
             STRING_AGG(DISTINCT t.client, ', ') AS client,
             COALESCE(ng.groups, 0) AS groups,
             STRING_AGG(DISTINCT NULLIF(t.comments, ''), E'\\n---\\n') AS comments
      FROM tour t
      LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
      WHERE ${baseWhere} AND t.type = 'regular'
      GROUP BY t."tourDate", t."tourHour", t.activity, t.status, t.type, t.duration, t.language, ng.groups`;

    const unionSql = `(${nonRegularSql}) UNION ALL (${regularSql})`;

    const [data, count, agg] = await Promise.all([
      this.pool.query(
        `SELECT * FROM (${unionSql}) s ORDER BY s."tourDate" ASC, s."tourHour" ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS total FROM (${unionSql}) s`,
        params
      ),
      this.pool.query(
        `SELECT COALESCE(SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian"), 0)::int AS "paxTotal"
         FROM tour t
         WHERE ${baseWhere} AND t.status != 'Cancelado'`,
        params
      ),
    ]);

    return {
      rows: data.rows.map(r => ({
        ...r,
        guides: r.guides ? [...new Set(r.guides.split(',').map(g => g.trim()).filter(Boolean))].join(',') : '',
        formatedTourDate: formatDate(r.tourDate),
      })),
      total: count.rows[0].total || 0,
      totals: { paxTotal: agg.rows[0].paxTotal || 0 },
    };
  }

  async findSummaryFilterOptions(months, year, filters = {}, column = null) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const entries = column
      ? Object.entries(FILTERABLE_SUMMARY_COLS).filter(([k]) => k === column)
      : Object.entries(FILTERABLE_SUMMARY_COLS);

    const result = {};
    await Promise.all(entries.map(async ([key, col]) => {
      const params = [year, ...monthsArr];
      const clauses = this._buildFilterClausesExcluding(filters, FILTERABLE_SUMMARY_COLS, key, params);
      const filterSQL = clauses.length ? 'AND ' + clauses.join(' AND ') : '';
      const res = await this.pool.query(
        `SELECT DISTINCT COALESCE(${col}, '') AS value
         FROM tour t
         WHERE EXTRACT(YEAR FROM t."tourDate") = $1
           AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
           AND t.canceled = 0 AND t.origin = 'office' AND t."tourHour" != ''
           ${filterSQL}
         ORDER BY value ASC`,
        params
      );
      result[key] = res.rows.map(r => r.value === '' ? '__VAZIO__' : r.value);
    }));
    return result;
  }

  async findCanceled(year, months) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const res = await this.pool.query(
      `SELECT t.*,
         EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests"
       FROM tour t
       WHERE EXTRACT(YEAR FROM t."tourDate") = $1
         AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
         AND t.canceled = 1
       ORDER BY t."tourDate" ASC`,
      [year, ...monthsArr]
    );
    return res.rows.map(r => ({ ...r, formatedTourDate: formatDate(r.tourDate) }));
  }

  async cancel(id, cancelReason, lastEditBy, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE tour SET canceled = 1, "cancelReason" = $1, "lastEditBy" = $2 WHERE id = $3`,
      [cancelReason || '', lastEditBy || '', id]
    );
  }

  async cancelMultiple(idArr, cancelReason, lastEditBy) {
    const placeholders = idArr.map((_, i) => `$${i + 3}`).join(',');
    const res = await this.pool.query(
      `UPDATE tour SET canceled = 1, "cancelReason" = $1, "lastEditBy" = $2
       WHERE id IN (${placeholders}) RETURNING id`,
      [cancelReason || '', lastEditBy || '', ...idArr]
    );
    return res;
  }

  async uncancel(id, lastEditBy) {
    await this.pool.query(
      `UPDATE tour SET canceled = 0, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async insertFinancial(t, year, dayOrderId, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `INSERT INTO tour (type, "orderRef", platform, activity, adicional, "tourDate", "tourHour",
       status, "paymentStatus", client, "clientName", "clientContact", "paymentMethod", currency,
       "totalValue", "netValue", "financialComments", company, "invoiceNumber", "accountNumber",
       "paymentDate", "isHighSeason", commissioned, "dateOfRegistration", "createdBy", "lastEditBy",
       origin, "dayOrderId", year, "conversationHistory", "comments")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
       RETURNING id`,
      [
        t.type, t.orderRef, t.platform, t.activity, t.adicional,
        t.tourDate, t.tourHour, t.status, t.paymentStatus,
        t.client, t.clientName, t.clientContact,
        t.paymentMethod, t.currency, t.totalValue,
        t.netValue, t.financialComments, t.company,
        t.invoiceNumber, t.accountNumber,
        t.paymentDate, t.isHighSeason, t.commissioned,
        t.dateOfRegistration, t.createdBy, t.lastEditBy,
        'financial', dayOrderId, year, t.conversationHistory, t.comments,
      ]
    );
    return res.rows[0].id;
  }

  async updateFinancial(id, t, dayOrderId, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE tour SET type=$1, "orderRef"=$2, platform=$3, activity=$4, adicional=$5, "tourDate"=$6,
       "tourHour"=$7, status=$8, "paymentStatus"=$9, client=$10, "clientName"=$11, "clientContact"=$12,
       "paymentMethod"=$13, currency=$14, "totalValue"=$15, "netValue"=$16, "financialComments"=$17,
       company=$18, "invoiceNumber"=$19, "accountNumber"=$20, "paymentDate"=$21, "isHighSeason"=$22,
       commissioned=$23, "lastEditBy"=$24, "dayOrderId"=$25, comments=$26, "conversationHistory"=$27
       WHERE id=$28`,
      [
        t.type, t.orderRef, t.platform, t.activity, t.adicional,
        t.tourDate, t.tourHour, t.status, t.paymentStatus,
        t.client, t.clientName, t.clientContact,
        t.paymentMethod, t.currency, t.totalValue,
        t.netValue, t.financialComments, t.company,
        t.invoiceNumber, t.accountNumber,
        t.paymentDate, t.isHighSeason, t.commissioned,
        t.lastEditBy, dayOrderId, t.comments, t.conversationHistory, id,
      ]
    );
  }

  async findAvailableHours(date, type, status) {
    const res = await this.pool.query(
      `SELECT DISTINCT "tourHour" FROM tour
       WHERE "tourDate" = $1 AND type = $2 AND status = $3 AND canceled = 0
       ORDER BY "tourHour" ASC`,
      [date, type, status]
    );
    return res.rows.map(r => r.tourHour);
  }

  async findClientsByDateAndHour(date, hour) {
    const res = await this.pool.query(
      `SELECT client, "companionName", "companionContact" FROM tour
       WHERE "tourDate"::date = $1::date AND "tourHour" = $2 AND (canceled = 0 OR canceled IS NULL)
       ORDER BY client ASC`,
      [date, hour]
    );
    return res.rows;
  }

  async markLateCheck(id, lastEditBy) {
    await this.pool.query(
      `UPDATE tour SET "lateCheck" = 1, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async findRegularList(date, hour) {
    const res = await this.pool.query(
      `SELECT t.*, ROW_NUMBER() OVER (ORDER BY t.id) as n
       FROM tour t
       WHERE "tourDate" = $1 AND "tourHour" = $2 AND status = 'Confirmado' AND type = 'regular' AND canceled = 0
       ORDER BY t.id ASC`,
      [date, hour]
    );
    return res.rows;
  }

  async setField(id, field, value, tx) {
    const db = this._db(tx);
    await db.query(`UPDATE tour SET "${field}" = $1 WHERE id = $2`, [value, id]);
  }

  // ── Paginated versions ─────────────────────────────────────────────────────

  _baseWhere(year, monthsArr, filterClauses, extraConditions = '') {
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';
    return `EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        ${extraConditions}
        ${filterSQL}`;
  }

  async findAllPaginated(year, months, filters, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const params = [year, ...monthsArr];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_TOUR_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n        AND ') : '';
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const whereBase = `EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.canceled = 0 AND t.origin = 'office'
        ${filterSQL}`;

    const [data, count, agg] = await Promise.all([
      this.pool.query(
        `SELECT t.*,
           CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
           EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
           EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
         FROM tour t
         LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
         WHERE ${whereBase}
         ORDER BY t."tourDate" ASC, t."tourHour" ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int as total FROM tour t
         WHERE ${whereBase}`,
        params
      ),
      this.pool.query(
        `SELECT COALESCE(SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian"), 0)::int AS "paxTotal"
         FROM tour t
         WHERE ${whereBase} AND t.status != 'Cancelado'`,
        params
      ),
    ]);

    return {
      rows: data.rows.map(r => ({
        ...r,
        formatedTourDate:           formatDate(r.tourDate),
        dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
        formatedPaymentDate:        formatDate(r.paymentDate),
      })),
      total: count.rows[0].total,
      totals: {
        paxTotal: agg.rows[0].paxTotal || 0,
      },
    };
  }

  async findAllFinancialPaginated(year, months, currentYear, filters, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const params = [year, ...monthsArr, currentYear];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const currentYearIdx = params.length;
    const filterClauses = this._buildFilterClauses(filters, FILTERABLE_FINANCIAL_COLS, params);
    const filterSQL = filterClauses.length ? 'AND ' + filterClauses.join('\n      AND ') : '';
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const whereBase = `EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.year = $${currentYearIdx}
        AND t.canceled = 0
        ${filterSQL}`;

    const [data, count, agg] = await Promise.all([
      this.pool.query(
        `SELECT t.*,
           CASE WHEN t.type = 'regular' THEN ng.groups ELSE t."numberOfGroups" END as groups,
           EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests",
           EXISTS(SELECT 1 FROM comissions c WHERE c."tourId" = t.id AND c.deleted = 0) as comissioned
         FROM tour t
         LEFT JOIN "numberOfGroups" ng ON ng.date = t."tourDate" AND ng.hour = t."tourHour" AND ng.activity = t.activity
         WHERE ${whereBase}
         ORDER BY t."tourDate" ASC, t."tourHour" ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int as total FROM tour t
         WHERE ${whereBase}`,
        params
      ),
      this.pool.query(
        `SELECT
           COALESCE(SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian"), 0)::int AS "paxTotal",
           COALESCE(SUM(CASE WHEN t.currency = 'R$' AND t."totalValue" ~ '^[0-9]+(\\.[0-9]+)?$' THEN t."totalValue"::NUMERIC ELSE 0 END), 0) AS "realTotal",
           COALESCE(SUM(CASE WHEN t.currency = '$' AND t."totalValue" ~ '^[0-9]+(\\.[0-9]+)?$' THEN t."totalValue"::NUMERIC ELSE 0 END), 0) AS "dollarTotal"
         FROM tour t
         WHERE ${whereBase}`,
        params
      ),
    ]);

    return {
      rows: data.rows.map(r => ({
        ...r,
        formatedTourDate:           formatDate(r.tourDate),
        dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
        formatedPaymentDate:        formatDate(r.paymentDate),
      })),
      total: count.rows[0].total,
      totals: {
        paxTotal:    agg.rows[0].paxTotal    || 0,
        realTotal:   parseFloat(agg.rows[0].realTotal)   || 0,
        dollarTotal: parseFloat(agg.rows[0].dollarTotal) || 0,
      },
    };
  }

  async findCanceledPaginated(year, months, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);
    const baseParams = [year, ...monthsArr];

    const whereBase = `EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
        AND t.canceled = 1`;

    const [data, count] = await Promise.all([
      this.pool.query(
        `SELECT t.*,
           EXISTS(SELECT 1 FROM "changeRequests" cr WHERE cr."tourId" = t.id) as "haveChangeRequests"
         FROM tour t
         WHERE ${whereBase}
         ORDER BY t."tourDate" ASC
         LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
        [...baseParams, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int as total FROM tour t WHERE ${whereBase}`,
        baseParams
      ),
    ]);

    return {
      rows: data.rows.map(r => ({ ...r, formatedTourDate: formatDate(r.tourDate) })),
      total: count.rows[0].total,
    };
  }

  // ── Filter options (server-side, cascading) ────────────────────────────────

  _buildFilterClausesExcluding(filters, whitelist, excludeKey, params) {
    const clauses = [];
    for (const [key, rawVal] of Object.entries(filters || {})) {
      if (!key.startsWith('f_')) continue;
      const colKey = key.slice(2);
      if (colKey === excludeKey) continue;
      const dbCol = whitelist[colKey];
      if (!dbCol) continue;
      const values = decodeURIComponent(rawVal).split('|').map(v => v.trim()).filter(v => v !== '');
      if (!values.length) continue;
      clauses.push(this._buildColClause(dbCol, values, params));
    }
    return clauses;
  }

  async findFilterOptions(year, months, filters, column = null) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const entries = column
      ? Object.entries(FILTERABLE_TOUR_COLS).filter(([k]) => k === column)
      : Object.entries(FILTERABLE_TOUR_COLS);

    const result = {};
    await Promise.all(entries.map(async ([key, col]) => {
      const params = [year, ...monthsArr];
      const clauses = this._buildFilterClausesExcluding(filters, FILTERABLE_TOUR_COLS, key, params);
      const filterSQL = clauses.length ? 'AND ' + clauses.join(' AND ') : '';
      const res = await this.pool.query(
        `SELECT DISTINCT COALESCE(${col}, '') AS value
         FROM tour t
         WHERE EXTRACT(YEAR FROM t."tourDate") = $1
           AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
           AND t.canceled = 0 AND t.origin = 'office'
           ${filterSQL}
         ORDER BY value ASC`,
        params
      );
      result[key] = res.rows.map(r => r.value === '' ? '__VAZIO__' : r.value);
    }));
    return result;
  }

  async findFinancialFilterOptions(year, months, currentYear, filters, column = null) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const entries = column
      ? Object.entries(FILTERABLE_FINANCIAL_COLS).filter(([k]) => k === column)
      : Object.entries(FILTERABLE_FINANCIAL_COLS);

    const result = {};
    await Promise.all(entries.map(async ([key, col]) => {
      const params = [year, ...monthsArr, currentYear];
      const currentYearIdx = params.length;
      const clauses = this._buildFilterClausesExcluding(filters, FILTERABLE_FINANCIAL_COLS, key, params);
      const filterSQL = clauses.length ? 'AND ' + clauses.join(' AND ') : '';
      const res = await this.pool.query(
        `SELECT DISTINCT COALESCE(${col}, '') AS value
         FROM tour t
         WHERE EXTRACT(YEAR FROM t."tourDate") = $1
           AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
           AND t.year = $${currentYearIdx}
           AND t.canceled = 0
           ${filterSQL}
         ORDER BY value ASC`,
        params
      );
      result[key] = res.rows.map(r => r.value === '' ? '__VAZIO__' : r.value);
    }));
    return result;
  }
}

module.exports = { TourRepository };
