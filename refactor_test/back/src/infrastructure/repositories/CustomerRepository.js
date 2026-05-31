const FILTERABLE = {
  customerName:    'c."customerName"',
  customerType:    'c."customerType"',
  contactName:     'cc."contactName"',
  contactContact:  'cc."contactContact"',
  contactOffice:   'cc."contactOffice"',
  contactEmail:    'cc."contactEmail"',
};

const SEARCHABLE_COLS = [
  'c."customerName"',
  'c."customerType"',
  'cc."contactName"',
  'cc."contactContact"',
  'cc."contactOffice"',
  'cc."contactEmail"',
];

class CustomerRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  _buildWhere({ filters = {}, search = '', excludeKey = null }) {
    const conds = ['cc.deleted = 0'];
    const params = [];
    for (const [key, col] of Object.entries(FILTERABLE)) {
      if (key === excludeKey) continue;
      const vals = filters[key];
      if (Array.isArray(vals) && vals.length > 0) {
        const ph = vals.map(v => { params.push(String(v)); return `$${params.length}`; }).join(',');
        conds.push(`COALESCE(${col}, '') IN (${ph})`);
      }
    }
    const term = String(search || '').trim();
    if (term) {
      params.push(`%${term.toLowerCase()}%`);
      const i = params.length;
      const ors = SEARCHABLE_COLS.map(c => `LOWER(COALESCE(${c}, '')) LIKE $${i}`).join(' OR ');
      conds.push(`(${ors})`);
    }
    return { where: conds.join(' AND '), params };
  }

  async findByName(name, tx) {
    const db = this._db(tx);
    const res = await db.query(`SELECT id FROM customers WHERE "customerName" = $1`, [name]);
    return res.rows[0] || null;
  }

  async findContactByCustomerAndName(customerName, contactName, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT cc.id FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE c."customerName" = $1 AND cc."contactName" = $2`,
      [customerName, contactName || '']
    );
    return res.rows[0] || null;
  }

  async insert(customerName, customerType, createdBy, lastEditBy, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `INSERT INTO customers ("customerName","customerType","createdBy","lastEditBy") VALUES ($1,$2,$3,$4) RETURNING id`,
      [customerName || '', customerType || '', createdBy || '', lastEditBy || '']
    );
    return res.rows[0].id;
  }

  async insertContact(customerId, contact, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO "customerContacts" ("customerId","contactName","contactContact","contactOffice","contactEmail","createdBy","lastEditBy")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [customerId, contact.name || '', contact.contact || '', contact.office || '', contact.email || '', contact.createdBy || '', contact.lastEditBy || '']
    );
  }

  async update(customerId, customerName, customerType, lastEditBy, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE customers SET "customerName"=$1,"customerType"=$2,"lastEditBy"=$3 WHERE id=$4`,
      [customerName || '', customerType || '', lastEditBy || '', customerId]
    );
  }

  async deleteContacts(customerId, tx) {
    const db = this._db(tx);
    await db.query(`DELETE FROM "customerContacts" WHERE "customerId" = $1`, [customerId]);
  }

  async deleteContact(id) {
    await this.pool.query(`DELETE FROM "customerContacts" WHERE id = $1`, [id]);
  }

  async findAll() {
    const res = await this.pool.query(
      `SELECT c.id as "customerId", c."customerName", c."customerType",
              cc.id as "contactId", cc."contactName", cc."contactContact", cc."contactOffice", cc."contactEmail"
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE cc.deleted = 0 ORDER BY c.id ASC, cc.id ASC`
    );
    return res.rows;
  }

  async findById(customerId) {
    const res = await this.pool.query(
      `SELECT c.id as "customerId", c."customerName", c."customerType",
              cc.id as "contactId", cc."contactName", cc."contactContact", cc."contactOffice", cc."contactEmail"
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE c.id = $1 ORDER BY cc.id ASC`,
      [customerId]
    );
    return res.rows;
  }

  async findGrouped() {
    const res = await this.pool.query(
      `SELECT c."customerName" as name, c."customerType",
              JSON_AGG(JSON_BUILD_OBJECT('id', cc.id, 'contactName', cc."contactName",
                'contactContact', cc."contactContact", 'contactEmail', cc."contactEmail") ORDER BY cc.id) as contacts
       FROM customers c
       INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
       WHERE cc.deleted = 0
       GROUP BY c.id, c."customerName", c."customerType"
       ORDER BY c.id ASC`
    );
    return res.rows;
  }

  async findPaginated({ filters = {}, search = '', limit = 80, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 80, 1), 500);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
    const { where, params } = this._buildWhere({ filters, search });
    const pData = [...params, safeLimit, safeOffset];
    const [data, count] = await Promise.all([
      this.pool.query(
        `SELECT c.id as "customerId", c."customerName", c."customerType",
                cc.id as "contactId", cc."contactName", cc."contactContact", cc."contactOffice", cc."contactEmail"
         FROM customers c INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
         WHERE ${where} ORDER BY c.id ASC, cc.id ASC
         LIMIT $${pData.length - 1} OFFSET $${pData.length}`,
        pData
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS total, COUNT(DISTINCT c.id)::int AS unique_customers
         FROM customers c INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
         WHERE ${where}`,
        params
      ),
    ]);
    return {
      rows: data.rows,
      total: count.rows[0].total,
      uniqueCustomers: count.rows[0].unique_customers,
      limit: safeLimit,
      offset: safeOffset,
    };
  }

  async findFilterOptions({ filters = {}, search = '', column = null } = {}) {
    const keys = column ? [column] : Object.keys(FILTERABLE);
    const result = {};
    await Promise.all(keys.filter(k => FILTERABLE[k]).map(async (key) => {
      const col = FILTERABLE[key];
      const { where, params } = this._buildWhere({ filters, search, excludeKey: key });
      const r = await this.pool.query(
        `SELECT DISTINCT COALESCE(${col}, '') AS value
         FROM customers c INNER JOIN "customerContacts" cc ON c.id = cc."customerId"
         WHERE ${where} ORDER BY value ASC`,
        params
      );
      result[key] = r.rows.map(row => row.value);
    }));
    return result;
  }
}

module.exports = { CustomerRepository };
