class TourEditHistoryRepository {
  constructor(pool) { this.pool = pool; }
  _db(tx) { return tx || this.pool; }

  async insertMany(records, tx) {
    const db = this._db(tx);
    for (const r of records) {
      await db.query(
        `INSERT INTO "tourEditHistory" ("tourId","type","fieldName","fieldLabel","oldValue","newValue","editedBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [r.tourId, r.type, r.fieldName, r.fieldLabel, r.oldValue, r.newValue, r.editedBy]
      );
    }
  }

  async findByTourId(tourId, type = null) {
    let sql = `SELECT * FROM "tourEditHistory" WHERE "tourId" = $1`;
    const params = [tourId];
    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }
    sql += ` ORDER BY "editedAt" DESC`;
    const res = await this.pool.query(sql, params);
    return res.rows;
  }
}

module.exports = { TourEditHistoryRepository };
