const { formatDate } = require('../../shared/db');

class ComissionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async insert(tourId, orderRef, data, year, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO comissions ("tourId","orderRef","comissionersName","comissionersContact","comissionCurrency","comissionPrice","comissionPaid","createdBy","lastEditBy",year,"dateOfRegistration")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [tourId, orderRef, data.comissionersName || '', data.comissionersContact || '',
       data.comissionCurrency || '', data.comissionPrice || '', data.comissionPaid ? '1' : '0',
       data.createdBy || '', data.lastEditBy || '', year, data.dateOfRegistration || null]
    );
  }

  async findById(id) {
    const res = await this.pool.query(`SELECT * FROM comissions WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findById_linked(id, tx) {
    const db = this._db(tx);
    const res = await db.query(`SELECT id FROM comissions WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findAll(year, months) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const res = await this.pool.query(
      `SELECT c.*, t."tourDate"
       FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
       WHERE t.canceled = 0 AND c.deleted = 0
         AND EXTRACT(YEAR FROM t."tourDate") = $1
         AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})
       ORDER BY t."tourDate" ASC`,
      [year, ...monthsArr]
    );
    return res.rows.map(r => ({ ...r, tourDateFormated: formatDate(r.tourDate) }));
  }

  async update(id, data, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE comissions SET "comissionersName"=$1,"comissionersContact"=$2,"comissionCurrency"=$3,
       "comissionPrice"=$4,"comissionPaid"=$5,"lastEditBy"=$6 WHERE id=$7`,
      [data.comissionersName || '', data.comissionersContact || '', data.comissionCurrency || '',
       data.comissionPrice || '', data.comissionPaid ? '1' : '0', data.lastEditBy || '', id]
    );
  }

  async updateWithOrderRef(id, data, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE comissions SET "orderRef"=$1,"comissionersName"=$2,"comissionersContact"=$3,
       "comissionCurrency"=$4,"comissionPrice"=$5,"comissionPaid"=$6,"lastEditBy"=$7 WHERE id=$8`,
      [data.orderRef || '', data.comissionersName || '', data.comissionersContact || '',
       data.comissionCurrency || '', data.comissionPrice || '', data.comissionPaid ? '1' : '0',
       data.lastEditBy || '', id]
    );
  }

  async softDelete(id) {
    const res = await this.pool.query(`SELECT "tourId" FROM comissions WHERE id = $1`, [id]);
    if (!res.rows.length) return null;
    const tourId = res.rows[0].tourId;
    await this.pool.query(`UPDATE comissions SET deleted = 1 WHERE id = $1`, [id]);
    return tourId;
  }

  async markTourUncommissioned(tourId) {
    await this.pool.query(`UPDATE tour SET commissioned = 0 WHERE id = $1`, [tourId]);
  }

  async setPaid(id, lastEditBy) {
    await this.pool.query(
      `UPDATE comissions SET "comissionPaid" = 1, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async setUnpaid(id, lastEditBy) {
    await this.pool.query(
      `UPDATE comissions SET "comissionPaid" = 0, "lastEditBy" = $1 WHERE id = $2`,
      [lastEditBy || '', id]
    );
  }

  async findAllPaginated(year, months, limit = 80, offset = 0) {
    const monthsArr = months ? months.split(',').map(Number) : [];
    const monthsPlaceholders = monthsArr.map((_, i) => `$${i + 2}`).join(',');
    const safeLimit = Math.min(Math.max(parseInt(limit) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);
    const baseParams = [year, ...monthsArr];

    const whereBase = `t.canceled = 0 AND c.deleted = 0
        AND EXTRACT(YEAR FROM t."tourDate") = $1
        AND EXTRACT(MONTH FROM t."tourDate") IN (${monthsPlaceholders})`;

    const [data, count, agg] = await Promise.all([
      this.pool.query(
        `SELECT c.*, t."tourDate"
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}
         ORDER BY t."tourDate" ASC
         LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
        [...baseParams, safeLimit, safeOffset]
      ),
      this.pool.query(
        `SELECT COUNT(*)::int as total
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}`,
        baseParams
      ),
      this.pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN c."comissionCurrency" = 'R$' AND c."comissionPrice" ~ '^[0-9]+(\\.[0-9]+)?$' THEN c."comissionPrice"::NUMERIC ELSE 0 END), 0) AS "totalReal",
           COALESCE(SUM(CASE WHEN c."comissionCurrency" = '$' AND c."comissionPrice" ~ '^[0-9]+(\\.[0-9]+)?$' THEN c."comissionPrice"::NUMERIC ELSE 0 END), 0) AS "totalDollar"
         FROM comissions c INNER JOIN tour t ON t.id = c."tourId"
         WHERE ${whereBase}`,
        baseParams
      ),
    ]);

    return {
      rows: data.rows.map(r => ({ ...r, tourDateFormated: formatDate(r.tourDate) })),
      total: count.rows[0].total,
      totals: {
        totalReal:   parseFloat(agg.rows[0].totalReal)   || 0,
        totalDollar: parseFloat(agg.rows[0].totalDollar) || 0,
      },
    };
  }
}

module.exports = { ComissionRepository };
