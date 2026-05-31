class ProductRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  _variantParams(productId, v) {
    return [
      productId, v.pricingType || 'person', v.priceAdult || 0, v.priceHalf || 0,
      v.priceNet || 0, v.priceBrazilian || 0, v.priceFree || 0, v.priceGroup || 0, v.paxLimit || 0,
      v.priceAdultHighSeason || 0, v.priceHalfHighSeason || 0, v.priceNetHighSeason || 0,
      v.priceFreeHighSeason || 0, v.priceBrazilianHighSeason || 0, v.priceGroupHighSeason || 0,
    ];
  }

  async insert(type, category, name, duration, tx) {
    const db = this._db(tx);
    const res = await db.query(
      `INSERT INTO product (type, category, name, duration) VALUES ($1,$2,$3,$4) RETURNING id`,
      [type || '', category || 'atividade', name || '', duration || '']
    );
    return res.rows[0].id;
  }

  async insertVariant(productId, v, tx) {
    const db = this._db(tx);
    await db.query(
      `INSERT INTO variant ("productId","pricingType","priceAdult","priceHalf","priceNet","priceBrazilian","priceFree","priceGroup","paxLimit",
       "priceAdultHighSeason","priceHalfHighSeason","priceNetHighSeason","priceFreeHighSeason","priceBrazilianHighSeason","priceGroupHighSeason")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      this._variantParams(productId, v)
    );
  }

  async update(productId, type, category, name, duration, tx) {
    const db = this._db(tx);
    await db.query(
      `UPDATE product SET type=$1, category=$2, name=$3, duration=$4 WHERE id=$5`,
      [type || '', category || 'atividade', name || '', duration || '', productId]
    );
  }

  async deleteVariants(productId, tx) {
    const db = this._db(tx);
    await db.query(`DELETE FROM variant WHERE "productId" = $1`, [productId]);
  }

  async delete(id) {
    await this.pool.query(`DELETE FROM product WHERE id = $1`, [id]);
  }

  async findAll() {
    const res = await this.pool.query(
      `SELECT p.id, p.type, p.category, p.name, p.duration,
              v.id AS "variantId", v."pricingType", v."priceAdult", v."priceHalf", v."priceNet",
              v."priceBrazilian", v."priceFree", v."priceGroup", v."paxLimit",
              v."priceAdultHighSeason", v."priceHalfHighSeason", v."priceNetHighSeason",
              v."priceFreeHighSeason", v."priceBrazilianHighSeason", v."priceGroupHighSeason"
       FROM product p
       LEFT JOIN variant v ON v."productId" = p.id
       ORDER BY p.name ASC, v."paxLimit" ASC NULLS LAST`
    );
    return res.rows;
  }

  async findById(productId) {
    const res = await this.pool.query(
      `SELECT p.*, v.id as "variantId", v."pricingType", v."priceAdult", v."priceHalf", v."priceNet",
              v."priceBrazilian", v."priceFree", v."priceGroup", v."paxLimit",
              v."priceAdultHighSeason", v."priceHalfHighSeason", v."priceNetHighSeason",
              v."priceFreeHighSeason", v."priceBrazilianHighSeason", v."priceGroupHighSeason"
       FROM product p INNER JOIN variant v ON v."productId" = p.id
       WHERE p.id = $1`,
      [productId]
    );
    return res.rows;
  }
}

module.exports = { ProductRepository };
