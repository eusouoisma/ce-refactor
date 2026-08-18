class AbandonedCartEmailRepository {
  constructor(pool) { this.pool = pool; }

  async listTemplates() {
    const res = await this.pool.query(`SELECT * FROM abandoned_cart_email_templates ORDER BY slot, language`);
    return res.rows;
  }

  async getTemplate(slot, language) {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_cart_email_templates WHERE slot = $1 AND language = $2`, [slot, language]
    );
    return res.rows[0] || null;
  }

  async upsertTemplate(slot, language, { subject, heading, body, ctaText }) {
    await this.pool.query(
      `INSERT INTO abandoned_cart_email_templates (slot, language, subject, heading, body, "ctaText", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (slot, language) DO UPDATE SET
         subject=EXCLUDED.subject, heading=EXCLUDED.heading, body=EXCLUDED.body,
         "ctaText"=EXCLUDED."ctaText", "updatedAt"=NOW()`,
      [slot, language, subject, heading, body, ctaText]
    );
  }

  async listSchedule() {
    const res = await this.pool.query(`SELECT * FROM abandoned_cart_email_schedule ORDER BY slot`);
    return res.rows;
  }

  async updateScheduleSlot(slot, { enabled, delayMinutes, discountEnabled, discountPercentage }) {
    await this.pool.query(
      `UPDATE abandoned_cart_email_schedule
       SET enabled=$1, "delayMinutes"=$2, "discountEnabled"=$3, "discountPercentage"=$4
       WHERE slot=$5`,
      [enabled, delayMinutes, discountEnabled, discountPercentage, slot]
    );
  }

  // Candidatos a receber email automático: carrinho realmente abandonado
  // (expirou) e ainda não recuperado por uma venda nova.
  async listCandidates() {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts ac
       WHERE ac.state = 'expired'
         AND ac."recoveredSaleId" IS NULL
         AND NOT EXISTS (
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
         )`
    );
    return res.rows;
  }

  // Carrinhos já recuperados cujo log de emails pode ter slot(s) habilitado(s)
  // sem nenhum status registrado (porque foram recuperados antes de esse slot
  // ser processado) — ver AbandonedCartEmailService._backfillRecoveredCarts.
  // minSlots é o número de slots habilitados no momento; é só um filtro
  // aproximado pra não reprocessar todo carrinho recuperado a cada tick.
  async listRecoveredForBackfill(minSlots) {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts
       WHERE "recoveredSaleId" IS NOT NULL
         AND jsonb_array_length(COALESCE("recoveryEmailsLog", '[]'::jsonb)) < $1`,
      [minSlots]
    );
    return res.rows;
  }

  async findBySaleId(saleId) {
    const res = await this.pool.query(`SELECT * FROM abandoned_carts WHERE "saleId" = $1`, [saleId]);
    return res.rows[0] || null;
  }

  // Acha o carrinho que tem esse resendId registrado em algum slot do log —
  // usado pelo webhook da Resend, que só manda o id do email, não o saleId.
  async findByResendId(resendId) {
    const res = await this.pool.query(
      `SELECT * FROM abandoned_carts WHERE "recoveryEmailsLog" @> $1::jsonb LIMIT 1`,
      [JSON.stringify([{ resendId }])]
    );
    return res.rows[0] || null;
  }

  async updateEmailsLog(saleId, log) {
    await this.pool.query(
      `UPDATE abandoned_carts SET "recoveryEmailsLog" = $1::jsonb WHERE "saleId" = $2`,
      [JSON.stringify(log), saleId]
    );
  }
}

module.exports = { AbandonedCartEmailRepository };
