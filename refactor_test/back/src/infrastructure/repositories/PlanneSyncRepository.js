class PlanneSyncRepository {
  constructor(pool) { this.pool = pool; }

  async findImportedPlanneIds() {
    const res = await this.pool.query(`SELECT "planneId" FROM tour WHERE "planneId" IS NOT NULL`);
    return new Set(res.rows.map(r => r.planneId));
  }
}

module.exports = { PlanneSyncRepository };
