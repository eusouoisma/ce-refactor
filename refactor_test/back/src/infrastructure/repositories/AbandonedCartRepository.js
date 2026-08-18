// Venda gerada a partir do nosso link de recuperação: não é um carrinho
// abandonado de verdade (é o rascunho/venda nova da tentativa de recuperação).
// 1) já foi registrada como recoveredSaleId de outro carrinho
// 2) o directLinkId no raw é um link que a gente gerou pra outro saleId
const NOT_RECOVERY_DRAFT = `
  NOT EXISTS (
    SELECT 1 FROM abandoned_carts orig
    WHERE orig."recoveredSaleId" = ac."saleId"
  )
  AND (
    COALESCE(ac.raw->>'directLinkId', '') = ''
    OR NOT EXISTS (
      SELECT 1 FROM abandoned_carts orig
      WHERE orig."directLinkId" IS NOT NULL
        AND orig."directLinkId" = ac.raw->>'directLinkId'
        AND orig."saleId" <> ac."saleId"
    )
  )
`;

class AbandonedCartRepository {
  constructor(pool) { this.pool = pool; }

  async upsert(data) {
    await this.pool.query(
      `INSERT INTO abandoned_carts
         ("saleId","planneCode",state,"hadTransaction","transactionStatus","customerId",
          "clientName","clientContact","clientEmail","clientPhone",
          activity,"tourDate","tourHour","totalValue",currency,country,language,raw,"receivedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
       ON CONFLICT ("saleId") DO UPDATE SET
         "planneCode"=EXCLUDED."planneCode", state=EXCLUDED.state, "hadTransaction"=EXCLUDED."hadTransaction",
         "transactionStatus"=EXCLUDED."transactionStatus", "customerId"=EXCLUDED."customerId",
         "clientName"=EXCLUDED."clientName", "clientContact"=EXCLUDED."clientContact",
         "clientEmail"=EXCLUDED."clientEmail", "clientPhone"=EXCLUDED."clientPhone", activity=EXCLUDED.activity,
         "tourDate"=EXCLUDED."tourDate", "tourHour"=EXCLUDED."tourHour", "totalValue"=EXCLUDED."totalValue",
         currency=EXCLUDED.currency, country=EXCLUDED.country, language=EXCLUDED.language,
         raw=EXCLUDED.raw, "receivedAt"=NOW()`,
      [
        data.saleId, data.planneCode || null, data.state || null, data.hadTransaction, data.transactionStatus || null,
        data.customerId || null, data.clientName || null, data.clientContact || null,
        data.clientEmail || null, data.clientPhone || null, data.activity || null,
        data.tourDate || null, data.tourHour || null, data.totalValue || null,
        data.currency || null, data.country || null, data.language || null,
        data.raw ? JSON.stringify(data.raw) : null,
      ]
    );
  }

  async list() {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts ac
       WHERE ${NOT_RECOVERY_DRAFT}
       ORDER BY ac."receivedAt" DESC`
    );
    return res.rows;
  }

  async setRecoveryLink(saleId, { recoveryUrl, recoverySentAt, directLinkId }) {
    await this.pool.query(
      `UPDATE abandoned_carts SET "recoveryUrl"=$1, "recoverySentAt"=$2, "directLinkId"=$3 WHERE "saleId"=$4`,
      [recoveryUrl, recoverySentAt, directLinkId || null, saleId]
    );
  }

  async findByDirectLinkId(directLinkId) {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts WHERE "directLinkId"=$1 LIMIT 1`,
      [directLinkId]
    );
    return res.rows[0] || null;
  }

  async markRecovered(saleId, recoveredSaleId) {
    await this.pool.query(
      `UPDATE abandoned_carts SET "recoveredSaleId"=$1, "recoveredAt"=NOW() WHERE "saleId"=$2`,
      [recoveredSaleId, saleId]
    );
  }

  async findByRecoveredSaleId(recoveredSaleId) {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts WHERE "recoveredSaleId"=$1 LIMIT 1`,
      [recoveredSaleId]
    );
    return res.rows[0] || null;
  }

}

module.exports = { AbandonedCartRepository };
