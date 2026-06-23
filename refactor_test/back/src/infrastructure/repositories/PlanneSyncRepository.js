class PlanneSyncRepository {
  constructor(pool) { this.pool = pool; }

  async findImportedPlanneIds() {
    const res = await this.pool.query(`SELECT "planneId" FROM tour WHERE "planneId" IS NOT NULL`);
    return new Set(res.rows.map(r => r.planneId));
  }

  async findTourByPlanneId(planneId) {
    const res = await this.pool.query(
      `SELECT id, "orderRef", activity FROM tour WHERE "planneId" = $1 LIMIT 1`,
      [planneId]
    );
    return res.rows[0] || null;
  }

  async updateFromPlanne(planneId, data) {
    await this.pool.query(
      `UPDATE tour SET
        "tourDate"=$1, "tourHour"=$2, type=$3, activity=$4,
        "paxAdult"=$5, "paxHalf"=$6, "paxFree"=$7, "paxNet"=$8, "paxBrazilian"=$9,
        "clientName"=$10, "clientContact"=$11, language=$12,
        currency=$13, "totalValue"=$14, comments=$15
       WHERE "planneId"=$16`,
      [
        data.tourDate, data.tourHour, data.type, data.activity,
        data.paxAdult, data.paxHalf, data.paxFree, data.paxNet, data.paxBrazilian,
        data.clientName, data.clientContact, data.language,
        data.currency, data.totalValue, data.comments,
        planneId,
      ]
    );
  }

  async cancelTourByPlanneId(planneId) {
    await this.pool.query(
      `UPDATE tour SET status='Cancelado', canceled=1 WHERE "planneId"=$1`,
      [planneId]
    );
  }

  async setPaymentStatusByPlanneId(planneId, paymentStatus) {
    await this.pool.query(
      `UPDATE tour SET "paymentStatus"=$1 WHERE "planneId"=$2`,
      [paymentStatus, planneId]
    );
  }

  // ── Webhook queue ────────────────────────────────────────────────────────────

  async queueEvent(action, saleId, { planneCode, stateTo, mappedData }) {
    const existing = await this.pool.query(
      `SELECT id FROM planne_webhook_queue WHERE "saleId"=$1 AND action=$2 AND status='pending' LIMIT 1`,
      [saleId, action]
    );
    if (existing.rows.length > 0) {
      await this.pool.query(
        `UPDATE planne_webhook_queue
           SET "planneCode"=$1, "stateTo"=$2, "mappedData"=$3, "receivedAt"=NOW()
         WHERE id=$4`,
        [planneCode || null, stateTo || null, mappedData ? JSON.stringify(mappedData) : null, existing.rows[0].id]
      );
    } else {
      await this.pool.query(
        `INSERT INTO planne_webhook_queue (action, "saleId", "planneCode", "stateTo", "mappedData")
         VALUES ($1,$2,$3,$4,$5)`,
        [action, saleId, planneCode || null, stateTo || null, mappedData ? JSON.stringify(mappedData) : null]
      );
    }
  }

  async getPendingQueue() {
    const res = await this.pool.query(
      `SELECT * FROM planne_webhook_queue WHERE status='pending' ORDER BY "receivedAt" ASC`
    );
    return res.rows;
  }

  async getQueueItemById(id) {
    const res = await this.pool.query(
      `SELECT * FROM planne_webhook_queue WHERE id=$1 AND status='pending' LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async markQueueItem(id, status) {
    await this.pool.query(
      `UPDATE planne_webhook_queue SET status=$1 WHERE id=$2`,
      [status, id]
    );
  }
}

module.exports = { PlanneSyncRepository };
