class NumberOfGroupsRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async upsertForRegular(date, hour, activity, groups, tx) {
    const db = this._db(tx);
    await db.query(
      `DELETE FROM "numberOfGroups" WHERE date = $1 AND hour = $2 AND activity = $3`,
      [date, hour, activity]
    );
    await db.query(
      `INSERT INTO "numberOfGroups" (date, hour, activity, groups) VALUES ($1,$2,$3,$4)`,
      [date, hour, activity, groups]
    );
  }

  async updateTourGroups(id, groups, tx) {
    const db = this._db(tx);
    await db.query(`UPDATE tour SET "numberOfGroups" = $1 WHERE id = $2`, [groups, id]);
  }

  async findAll() {
    const res = await this.pool.query(`SELECT * FROM "numberOfGroups"`);
    return res.rows;
  }
}

module.exports = { NumberOfGroupsRepository };
