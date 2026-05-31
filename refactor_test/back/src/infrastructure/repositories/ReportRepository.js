class ReportRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async analysisByCountry(startDate, endDate, orderBy) {
    const res = await this.pool.query(
      `SELECT country, currency,
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
              SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
       FROM tour
       WHERE status = 'Confirmado' AND canceled = 0 AND "tourDate" >= $1 AND "tourDate" <= $2
       GROUP BY country, currency
       ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}`,
      [startDate, endDate]
    );
    return res.rows;
  }

  async analysisByCustomers(startDate, endDate, clientSearch, orderBy) {
    let sql = `
      SELECT client, currency,
             SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
             SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
      FROM tour
      WHERE status = 'Confirmado' AND canceled = 0 AND "tourDate" >= $1 AND "tourDate" <= $2
    `;
    const params = [startDate, endDate];
    if (clientSearch) { params.push(`%${clientSearch}%`); sql += ` AND client ILIKE $${params.length}`; }
    sql += ` GROUP BY client, currency ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}`;
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  async analysisByProduct(startDate, endDate, orderBy) {
    const res = await this.pool.query(
      `SELECT activity, currency,
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax",
              SUM(CAST(NULLIF("totalValue",'') AS DECIMAL)) as "valorTotal"
       FROM tour
       WHERE status = 'Confirmado' AND canceled = 0 AND "tourDate" >= $1 AND "tourDate" <= $2
       GROUP BY activity, currency
       ORDER BY ${orderBy === 'valor' ? '"valorTotal" DESC' : '"totalPax" DESC'}`,
      [startDate, endDate]
    );
    return res.rows;
  }

  async analysisByHour(startDate, endDate, day, activities) {
    const dayFilter = day && day !== 'ALL'
      ? `AND TO_CHAR("tourDate", 'DY') = '${day}'`
      : '';
    const actFilter = activities && activities.length > 0
      ? `AND activity IN (${activities.map((_, i) => `$${i + 3}`).join(',')})`
      : '';
    const isRegularOnly = activities && activities.length === 1 && activities[0] === 'Regular';
    const hourExpr = isRegularOnly
      ? `"tourHour"`
      : `LPAD(EXTRACT(HOUR FROM "tourHour"::time)::TEXT, 2, '0') || ':00'`;

    const res = await this.pool.query(
      `SELECT ${hourExpr} as hora,
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as total
       FROM tour
       WHERE status = 'Confirmado' AND canceled = 0 AND "tourDate" >= $1 AND "tourDate" <= $2
         ${dayFilter} ${actFilter}
       GROUP BY hora ORDER BY hora ASC`,
      [startDate, endDate, ...(activities || [])]
    );
    return res.rows;
  }

  async analysisByWeekday(startDate, endDate, activities) {
    const actFilter = activities && activities.length > 0
      ? `AND activity IN (${activities.map((_, i) => `$${i + 3}`).join(',')})`
      : '';
    const res = await this.pool.query(
      `SELECT EXTRACT(DOW FROM "tourDate")::INT as dow,
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as total
       FROM tour
       WHERE status = 'Confirmado' AND canceled = 0 AND "tourDate" >= $1 AND "tourDate" <= $2
         ${actFilter}
       GROUP BY dow ORDER BY dow ASC`,
      [startDate, endDate, ...(activities || [])]
    );
    return res.rows;
  }

  async analysisRegularTour(startDate, endDate) {
    const res = await this.pool.query(
      `SELECT SUM("paxAdult") as "paxAdult", SUM("paxHalf") as "paxHalf",
              SUM("paxFree") as "paxFree", SUM("paxNet") as "paxNet",
              SUM("paxAdult"+"paxHalf"+"paxFree"+"paxNet"+"paxBrazilian") as "totalPax"
       FROM tour WHERE status = 'Confirmado' AND canceled = 0 AND type = 'regular'
         AND "tourDate" >= $1 AND "tourDate" <= $2`,
      [startDate, endDate]
    );
    return res.rows[0] || {};
  }
}

module.exports = { ReportRepository };
