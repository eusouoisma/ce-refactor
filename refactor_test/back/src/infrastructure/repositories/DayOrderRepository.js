const { formatDate } = require('../../shared/db');

class DayOrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async getOrCreate(tourDate, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT id FROM "dayOrder" WHERE date = $1 AND name = 'Tour Principal'`,
      [tourDate]
    );
    if (res.rows.length > 0) return res.rows[0].id;
    const dow = new Date(tourDate + 'T00:00:00').getDay();
    const ins = await db.query(
      `INSERT INTO "dayOrder" (date, name, "weekDay", comments) VALUES ($1, 'Tour Principal', $2, '') RETURNING id`,
      [tourDate, String(dow)]
    );
    return ins.rows[0].id;
  }

  async getForDateChange(tourDate, tx) {
    const db = this._db(tx);
    let res = await db.query(
      `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 AND type = 'regular' LIMIT 1`,
      [tourDate]
    );
    if (res.rows.length > 0) return res.rows[0].dayOrderId;
    res = await db.query(
      `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 LIMIT 1`,
      [tourDate]
    );
    if (res.rows.length > 0) return res.rows[0].dayOrderId;
    const dow = new Date(tourDate + 'T00:00:00').getDay();
    const ins = await db.query(
      `INSERT INTO "dayOrder" (date, name, "weekDay", comments) VALUES ($1, 'Tour Principal', $2, '') RETURNING id`,
      [tourDate, String(dow)]
    );
    return ins.rows[0].id;
  }

  async findActive() {
    const res = await this.pool.query(
      `SELECT d.* FROM "dayOrder" d
       WHERE EXISTS (
         SELECT 1 FROM tour t WHERE t."dayOrderId" = d.id
           AND t.status NOT IN ('Cancelado', 'Bloqueio') AND t.canceled = 0 AND t."tourHour" != ''
       )
       ORDER BY d.date ASC`
    );
    return res.rows.map(r => ({ ...r, formatedDate: formatDate(r.date) }));
  }

  async findById(id) {
    const res = await this.pool.query(`SELECT * FROM "dayOrder" WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findPrev(date) {
    const res = await this.pool.query(
      `SELECT id FROM "dayOrder" WHERE date < $1 ORDER BY date DESC LIMIT 1`, [date]
    );
    return res.rows[0]?.id || null;
  }

  async findNext(date) {
    const res = await this.pool.query(
      `SELECT id FROM "dayOrder" WHERE date > $1 ORDER BY date ASC LIMIT 1`, [date]
    );
    return res.rows[0]?.id || null;
  }

  async insertEmployee(dayOrderId, fn, name, phone) {
    const res = await this.pool.query(
      `INSERT INTO "dayOrderEmployee" ("dayOrderId", function, name, phone) VALUES ($1,$2,$3,$4) RETURNING id`,
      [dayOrderId, fn || '', name || '', phone || '']
    );
    return res.rows[0].id;
  }

  async findEmployeesForDayOrder(dayOrderId) {
    const res = await this.pool.query(
      `SELECT de.*, df."orderNumber"
       FROM "dayOrderEmployee" de
       INNER JOIN "dayOrderEmployeesFunctions" df ON LOWER(df.name) = LOWER(de.function)
       WHERE de."dayOrderId" = $1 AND de.deleted = 0
       ORDER BY df."orderNumber" ASC, de.id ASC`,
      [dayOrderId]
    );
    return res.rows;
  }

  async findCurrentGuides(dayOrderId) {
    const res = await this.pool.query(
      `SELECT id, name FROM "dayOrderEmployee" WHERE "dayOrderId" = $1 AND function = 'Guia' AND deleted = 0`,
      [dayOrderId]
    );
    return res.rows;
  }

  async findGuideNamesFromTours(dayOrderId) {
    const res = await this.pool.query(
      `SELECT DISTINCT UNNEST(STRING_TO_ARRAY(t."ceGuide", ',')) as guide
       FROM tour t WHERE t."dayOrderId" = $1 AND t."ceGuide" != '' AND t.canceled = 0`,
      [dayOrderId]
    );
    return res.rows.map(r => r.guide.trim()).filter(Boolean);
  }

  async findGuideEmployee(dayOrderId, name) {
    const res = await this.pool.query(
      `SELECT id FROM "dayOrderEmployee"
       WHERE "dayOrderId" = $1 AND name = $2 AND function = 'Guia' AND deleted = 0`,
      [dayOrderId, name]
    );
    return res.rows[0] || null;
  }

  async insertGuideEmployee(dayOrderId, guide, phone) {
    await this.pool.query(
      `INSERT INTO "dayOrderEmployee" ("dayOrderId", function, name, phone) VALUES ($1, 'Guia', $2, $3)`,
      [dayOrderId, guide, phone || '']
    );
  }

  async softDeleteEmployee(id) {
    await this.pool.query(`UPDATE "dayOrderEmployee" SET deleted = 1 WHERE id = $1`, [id]);
  }

  async findFixedEmployees() {
    const res = await this.pool.query(`SELECT * FROM "dayOrderEmployeesList" WHERE type = 'Fixo'`);
    return res.rows;
  }

  async markAutoInserted(dayOrderId) {
    await this.pool.query(`UPDATE "dayOrder" SET "autoInserted" = 1 WHERE id = $1`, [dayOrderId]);
  }

  async updateDayOrder(dayOrderId, comments, lastEditBy) {
    await this.pool.query(
      `UPDATE "dayOrder" SET comments=$1, "lastEditBy"=$2 WHERE id=$3`,
      [comments || '', lastEditBy || '', dayOrderId]
    );
  }

  async updateDayOrderEditor(dayOrderId, editedBy) {
    await this.pool.query(
      `UPDATE "dayOrder" SET "lastEditBy" = $1 WHERE id = $2`, [editedBy || '', dayOrderId]
    );
  }

  async updateEmployee(emp) {
    await this.pool.query(
      `UPDATE "dayOrderEmployee" SET function=$1, name=$2, prevision=$3, arrival=$4, departure=$5,
       phone=$6, comments=$7 WHERE id=$8`,
      [emp.function || '', emp.name || '', emp.prevision || '', emp.arrival || '',
       emp.departure || '', emp.phone || '', emp.comments || '', emp.id]
    );
  }

  async findAllPayments(year, months) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const res = await this.pool.query(
      `SELECT dp.*, dp.comments AS "paymentComments", d.date, df."orderNumber"
       FROM "dayOrderPayments" dp
       INNER JOIN "dayOrder" d ON d.id = dp."dayOrderId"
       INNER JOIN "dayOrderEmployeesFunctions" df ON LOWER(df.name) = LOWER(dp.function)
       WHERE EXTRACT(YEAR FROM d.date) = $1
         AND EXTRACT(MONTH FROM d.date) IN (${monthsPlaceholders})
       ORDER BY d.date ASC, df."orderNumber" ASC, dp."employeeName" ASC`,
      [year, ...monthsArr]
    );
    return res.rows.map(r => ({ ...r, formatedDate: formatDate(r.date) }));
  }

  async findEmployeesList() {
    const res = await this.pool.query(`SELECT * FROM "dayOrderEmployeesList" ORDER BY name ASC`);
    return res.rows;
  }

  async findEmployeePhone(name) {
    const res = await this.pool.query(
      `SELECT phone FROM "dayOrderEmployeesList" WHERE name = $1 LIMIT 1`, [name]
    );
    return res.rows[0]?.phone || '';
  }

  async findFunctions() {
    const res = await this.pool.query(
      `SELECT * FROM "dayOrderEmployeesFunctions" WHERE name != '' ORDER BY "orderNumber" ASC`
    );
    return res.rows;
  }

  async findRemunerations() {
    const res = await this.pool.query(`SELECT * FROM "dayOrderEmployeesRemunerations"`);
    return res.rows;
  }

  async employeeOptionExists(name, fn) {
    const res = await this.pool.query(
      `SELECT id FROM "dayOrderEmployeesList" WHERE name = $1 AND function = $2`, [name, fn]
    );
    return res.rows.length > 0;
  }

  async insertEmployeeOption(fn, type, name, phone) {
    const res = await this.pool.query(
      `INSERT INTO "dayOrderEmployeesList" (name, function, phone, type) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name || '', fn || '', phone || '', type || '']
    );
    return res.rows[0].id;
  }

  async updateEmployeeOption(id, fn, type, name, phone) {
    await this.pool.query(
      `UPDATE "dayOrderEmployeesList" SET name=$1, function=$2, phone=$3, type=$4 WHERE id=$5`,
      [name || '', fn || '', phone || '', type || '', id]
    );
  }

  async deleteEmployeeOption(id) {
    await this.pool.query(`DELETE FROM "dayOrderEmployeesList" WHERE id = $1`, [id]);
  }

  async insertFunction(name, orderNumber) {
    await this.pool.query(
      `INSERT INTO "dayOrderEmployeesFunctions" (name, "orderNumber") VALUES ($1,$2)`,
      [name || '', orderNumber || 0]
    );
  }

  async updateFunction(id, name, orderNumber) {
    await this.pool.query(
      `UPDATE "dayOrderEmployeesFunctions" SET name=$1, "orderNumber"=$2 WHERE id=$3`,
      [name || '', orderNumber || 0, id]
    );
  }

  async deleteFunction(id) {
    await this.pool.query(`DELETE FROM "dayOrderEmployeesFunctions" WHERE id = $1`, [id]);
  }

  async insertRemuneration(d) {
    await this.pool.query(
      `INSERT INTO "dayOrderEmployeesRemunerations" ("functionId","paymentType","activity","hourlyValue1","hourlyValue2","hourlyValue3")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [d.functionId, d.paymentType || 'day', d.activity || '', d.hourlyValue1 || 0, d.hourlyValue2 || 0, d.hourlyValue3 || 0]
    );
  }

  async deleteRemuneration(id) {
    await this.pool.query(`DELETE FROM "dayOrderEmployeesRemunerations" WHERE id = $1`, [id]);
  }

  async clearPayments(dayOrderId, tx) {
    const db = this._db(tx);
    await db.query(`DELETE FROM "dayOrderPayments" WHERE "dayOrderId" = $1`, [dayOrderId]);
  }

  async insertPayment(p, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO "dayOrderPayments" ("dayOrderId", function, "employeeName", arrival, departure, value, comments, activity, "tourHour", "paymentDate")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
      [p.dayOrderId, p.function, p.employeeName, p.arrival, p.departure, p.value, p.comments || '', p.activity, p.tourHour]
    );
  }

  async updatePaymentValue(paymentId, value) {
    await this.pool.query(`UPDATE "dayOrderPayments" SET value = $1 WHERE id = $2`, [value, paymentId]);
  }

  async updatePaymentComments(paymentId, comments) {
    await this.pool.query(`UPDATE "dayOrderPayments" SET comments = $1 WHERE id = $2`, [comments, paymentId]);
  }

  async findEmployeesWithType(dayOrderId) {
    const res = await this.pool.query(
      `SELECT de.*, del.type as "empType"
       FROM "dayOrderEmployee" de
       LEFT JOIN "dayOrderEmployeesList" del ON del.name = de.name AND del.function = de.function
       WHERE de."dayOrderId" = $1 AND de.deleted = 0`,
      [dayOrderId]
    );
    return res.rows;
  }

  async findToursByDayOrderId(dayOrderId) {
    const nonRegular = await this.pool.query(
      `SELECT
          t."tourDate", t."tourHour", t.type, t.activity,
          MAX(t.duration) as duration,
          STRING_AGG(DISTINCT t.language, ',') FILTER (WHERE t.language IS NOT NULL AND t.language != '') as language,
          STRING_AGG(DISTINCT t."ceGuide", ',') FILTER (WHERE t."ceGuide" IS NOT NULL AND t."ceGuide" != '') as guides,
          SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
          t.status,
          MAX(t."numberOfGroups") as "numberOfGroups",
          STRING_AGG(DISTINCT NULLIF(t.comments, ''), E'\\n---\\n') as comments
       FROM tour t
       WHERE t."dayOrderId" = $1
         AND t."tourHour" != ''
         AND t.status NOT IN ('Cancelado', 'Bloqueio')
         AND t.canceled = 0
         AND t.type != 'regular'
         AND t.origin = 'office'
       GROUP BY t."tourDate", t."tourHour", t.activity, t.type, t.status
       ORDER BY t."tourHour" ASC`,
      [dayOrderId]
    );
    const regular = await this.pool.query(
      `SELECT
          t."tourDate", t."tourHour", t.type, t.activity,
          MAX(t.duration) as duration,
          STRING_AGG(DISTINCT t.language, ',') FILTER (WHERE t.language IS NOT NULL AND t.language != '') as language,
          STRING_AGG(DISTINCT t."ceGuide", ',') FILTER (WHERE t."ceGuide" IS NOT NULL AND t."ceGuide" != '') as guides,
          SUM(t."paxAdult" + t."paxHalf" + t."paxFree" + t."paxNet" + t."paxBrazilian") as "paxTotal",
          t.status,
          MAX(t."numberOfGroups") as "numberOfGroups",
          STRING_AGG(DISTINCT NULLIF(t.comments, ''), E'\\n---\\n') as comments
       FROM tour t
       WHERE t."dayOrderId" = $1
         AND t."tourHour" != ''
         AND t.status != 'Cancelado'
         AND t.canceled = 0
         AND t.type = 'regular'
         AND t.origin = 'office'
       GROUP BY t."tourDate", t."tourHour", t.activity, t.type, t.status
       ORDER BY t."tourHour" ASC`,
      [dayOrderId]
    );
    return { nonRegular: nonRegular.rows, regular: regular.rows };
  }

  async findToursByDate(date) {
    const res = await this.pool.query(
      `SELECT t."tourDate", t."tourHour", t.type, t.activity, t.language,
              STRING_AGG(DISTINCT t."ceGuide", ',') as guides,
              SUM(t."paxAdult"+t."paxHalf"+t."paxFree"+t."paxNet"+t."paxBrazilian") as "paxTotal"
       FROM tour t WHERE t."tourDate" = $1 AND t.canceled = 0
       GROUP BY t."tourDate", t."tourHour", t.type, t.activity, t.language
       ORDER BY t."tourHour" ASC`,
      [date]
    );
    return res.rows;
  }

  async findGuideToursInDayOrder(dayOrderId, guideName) {
    const res = await this.pool.query(
      `SELECT DISTINCT "tourHour", activity FROM tour
       WHERE "dayOrderId" = $1 AND canceled = 0 AND "ceGuide" LIKE $2`,
      [dayOrderId, `%${guideName}%`]
    );
    return res.rows;
  }

  async findRemunerationForGuide(activity) {
    const res = await this.pool.query(
      `SELECT r."hourlyValue1" FROM "dayOrderEmployeesRemunerations" r
       INNER JOIN "dayOrderEmployeesFunctions" f ON f.id = r."functionId"
       WHERE f.name = 'Guia' AND r.activity = $1 LIMIT 1`,
      [activity]
    );
    return res.rows[0] || null;
  }

  async findRemunerationForFunction(fn) {
    const res = await this.pool.query(
      `SELECT r.* FROM "dayOrderEmployeesRemunerations" r
       INNER JOIN "dayOrderEmployeesFunctions" f ON f.id = r."functionId"
       WHERE f.name = $1 LIMIT 1`,
      [fn]
    );
    return res.rows[0] || null;
  }

  async insertNewDayOrder(date, name, dow, originalDayOrderId, editedBy) {
    const res = await this.pool.query(
      `INSERT INTO "dayOrder" (date, name, "weekDay", comments, "originalDayOrder", "lastEditBy")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [date, name, String(dow), '', originalDayOrderId, editedBy || '']
    );
    return res.rows[0].id;
  }

  async reassignToursToDayOrder(newDayOrderId, date, hour, activity, language) {
    await this.pool.query(
      `UPDATE tour SET "dayOrderId" = $1
       WHERE "tourDate" = $2 AND "tourHour" = $3 AND activity = $4 AND language = $5 AND canceled = 0`,
      [newDayOrderId, date, hour, activity, language]
    );
  }

  async findOriginalDayOrder(dayOrderId) {
    const res = await this.pool.query(
      `SELECT "originalDayOrder" FROM "dayOrder" WHERE id = $1`, [dayOrderId]
    );
    return res.rows[0]?.originalDayOrder || null;
  }

  async findDayOrderByDateAndType(date, type) {
    const res = await this.pool.query(
      `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 AND type = $2 LIMIT 1`,
      [date, type]
    );
    return res.rows[0]?.dayOrderId || null;
  }

  async findDayOrderByDate(date) {
    const res = await this.pool.query(
      `SELECT "dayOrderId" FROM tour WHERE "tourDate" = $1 LIMIT 1`, [date]
    );
    return res.rows[0]?.dayOrderId || null;
  }

  async clearAssociatedGuides(dayOrderId, tourHour, activity, language) {
    await this.pool.query(
      `DELETE FROM "dayOrderAssociateGuidesInTours"
       WHERE "dayOrderId" = $1 AND "tourHour" = $2 AND activity = $3 AND language = $4`,
      [dayOrderId, tourHour, activity, language]
    );
  }

  async insertAssociatedGuide(dayOrderId, tourHour, activity, language, guide) {
    await this.pool.query(
      `INSERT INTO "dayOrderAssociateGuidesInTours" ("dayOrderId","tourHour",activity,language,guide)
       VALUES ($1,$2,$3,$4,$5)`,
      [dayOrderId, tourHour, activity, language, guide]
    );
  }

  async findActivities() {
    const res = await this.pool.query(`SELECT * FROM product ORDER BY name ASC`);
    return res.rows;
  }
}

module.exports = { DayOrderRepository };
