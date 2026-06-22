class CustomerRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async findByName(name, tx) {
    const db = this._db(tx);
    const res = await db.query(`SELECT id FROM customers WHERE "companyName" = $1`, [name]);
    return res.rows[0] || null;
  }

  async insert(data, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `INSERT INTO customers
         ("companyName","customerType","address","phone","email","website","notes",
          "razaoSocial","cnpj","inscricaoEstadual","enderecoFiscal",
          "mainPhone","whatsapp","emailFinanceiro","emailComercial","status",
          "createdBy","lastEditBy")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id`,
      [
        data.companyName||'', data.customerType||'', data.address||'', data.phone||'',
        data.email||'', data.website||'', data.notes||'', data.razaoSocial||'',
        data.cnpj||'', data.inscricaoEstadual||'', data.enderecoFiscal||'',
        data.mainPhone||'', data.whatsapp||'', data.emailFinanceiro||'',
        data.emailComercial||'', data.status||'Ativo', data.createdBy||'', data.lastEditBy||'',
      ]
    );
    return res.rows[0].id;
  }

  async insertContact(customerId, contact, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO "customerContacts"
         ("customerId","firstName","lastName","role","email","whatsapp","notes","createdBy","lastEditBy")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        customerId,
        contact.firstName||'', contact.lastName||'', contact.role||'',
        contact.email||'', contact.whatsapp||'', contact.notes||'',
        contact.createdBy||'', contact.lastEditBy||'',
      ]
    );
  }

  async update(customerId, data, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE customers SET
         "companyName"=$1,"customerType"=$2,"address"=$3,"phone"=$4,"email"=$5,"website"=$6,"notes"=$7,
         "razaoSocial"=$8,"cnpj"=$9,"inscricaoEstadual"=$10,"enderecoFiscal"=$11,
         "mainPhone"=$12,"whatsapp"=$13,"emailFinanceiro"=$14,"emailComercial"=$15,
         "status"=$16,"lastEditBy"=$17
       WHERE id=$18`,
      [
        data.companyName||'', data.customerType||'', data.address||'', data.phone||'',
        data.email||'', data.website||'', data.notes||'', data.razaoSocial||'',
        data.cnpj||'', data.inscricaoEstadual||'', data.enderecoFiscal||'',
        data.mainPhone||'', data.whatsapp||'', data.emailFinanceiro||'',
        data.emailComercial||'', data.status||'Ativo', data.lastEditBy||'', customerId,
      ]
    );
  }

  async deleteContact(id) {
    await this.pool.query(`UPDATE "customerContacts" SET deleted=1 WHERE id=$1`, [id]);
  }

  async deleteContacts(customerId, tx) {
    const db = this._db(tx);
    await db.query(`DELETE FROM "customerContacts" WHERE "customerId"=$1`, [customerId]);
  }

  async findAll() {
    const res = await this.pool.query(
      `SELECT id, "companyName", "status"
       FROM customers
       WHERE TRIM("companyName") <> ''
       ORDER BY LOWER("companyName") ASC`
    );
    return res.rows;
  }

  async findById(customerId) {
    const [custRes, contRes] = await Promise.all([
      this.pool.query(`SELECT * FROM customers WHERE id=$1`, [customerId]),
      this.pool.query(
        `SELECT id,"firstName","lastName","role","email","whatsapp","notes"
         FROM "customerContacts"
         WHERE "customerId"=$1 AND deleted=0
         ORDER BY id ASC`,
        [customerId]
      ),
    ]);
    if (!custRes.rows[0]) return null;
    return { ...custRes.rows[0], contacts: contRes.rows };
  }

  async findGrouped() {
    const res = await this.pool.query(
      `SELECT c.id, c."companyName" as name, c.status,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', cc.id, 'firstName', cc."firstName", 'lastName', cc."lastName",
                    'email', cc."email", 'whatsapp', cc."whatsapp", 'role', cc."role"
                  ) ORDER BY cc.id ASC
                ) FILTER (WHERE cc.id IS NOT NULL AND cc.deleted=0),
                '[]'::json
              ) as contacts
       FROM customers c
       LEFT JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE TRIM(c."companyName") <> ''
       GROUP BY c.id
       ORDER BY LOWER(TRIM(c."companyName")) ASC`
    );
    return res.rows;
  }

  async findContactByCustomerAndName(customerName, contactFirstName, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT cc.id FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE c."companyName" = $1 AND cc."firstName" = $2 AND cc.deleted = 0`,
      [customerName, contactFirstName || '']
    );
    return res.rows[0] || null;
  }
}

module.exports = { CustomerRepository };
