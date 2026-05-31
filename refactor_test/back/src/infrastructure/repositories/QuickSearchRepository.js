const { formatDate } = require('../../shared/db');

class QuickSearchRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findOrderRefSuggestions(term) {
    const res = await this.pool.query(
      `SELECT DISTINCT "orderRef" as value, "orderRef" as label
       FROM tour WHERE "orderRef" ILIKE $1 AND status = 'Confirmado' AND canceled = 0 LIMIT 10`,
      [`%${term}%`]
    );
    return res.rows;
  }

  async findClientSuggestions(term) {
    const res = await this.pool.query(
      `SELECT DISTINCT client as value, client as label
       FROM tour WHERE client ILIKE $1 AND status = 'Confirmado' AND canceled = 0 LIMIT 10`,
      [`%${term}%`]
    );
    return res.rows;
  }

  async findTours({ orderRef, client }) {
    let where = `status = 'Confirmado' AND canceled = 0`;
    const params = [];
    if (orderRef) { params.push(`%${orderRef}%`); where += ` AND "orderRef" ILIKE $${params.length}`; }
    if (client)   { params.push(`%${client}%`);   where += ` AND client ILIKE $${params.length}`; }

    const res = await this.pool.query(
      `SELECT *, ("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
              EXTRACT(DOW FROM "tourDate")::INT as "weekDay"
       FROM tour WHERE ${where} ORDER BY "tourDate" DESC LIMIT 50`,
      params
    );
    return res.rows.map(r => ({
      ...r,
      dateOfRegistrationFormated: formatDate(r.dateOfRegistration),
    }));
  }
}

module.exports = { QuickSearchRepository };
