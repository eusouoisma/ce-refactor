class ChangeRequestRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async findByTourId(tourId) {
    const res = await this.pool.query(
      `SELECT * FROM "changeRequests" WHERE "tourId" = $1`, [tourId]
    );
    return res.rows;
  }

  async deleteByTourId(tourId, tx) {
    const db = this._db(tx);
    await db.query(`DELETE FROM "changeRequests" WHERE "tourId" = $1`, [tourId]);
  }

  async insert(tourId, cr, createdBy, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO "changeRequests" (type, name, "oldValue", "newValue", "tourId", "createdBy")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [cr.type || '', cr.name || '', cr.oldValue || '', cr.newValue || '', tourId, createdBy || '']
    );
  }
}

module.exports = { ChangeRequestRepository };
