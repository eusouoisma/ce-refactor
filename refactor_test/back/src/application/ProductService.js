class ProductService {
  constructor({ pool, productRepo }) {
    this.pool = pool;
    this.productRepo = productRepo;
  }

  async create(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const productId = await this.productRepo.insert(data.type, data.category, data.productName, data.duration, client);
      for (const v of (data.variants || [])) {
        await this.productRepo.insertVariant(productId, v, client);
      }
      await client.query('COMMIT');
      return { error: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.productRepo.update(data.productId, data.type, data.category, data.productName, data.duration, client);
      await this.productRepo.deleteVariants(data.productId, client);
      for (const v of (data.variants || [])) {
        await this.productRepo.insertVariant(data.productId, v, client);
      }
      await client.query('COMMIT');
      return { error: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteProduct(id) {
    await this.productRepo.delete(id);
    return { error: false };
  }

  async listAll() { return this.productRepo.findAll(); }
  async listById(id) { return this.productRepo.findById(id); }
}

module.exports = { ProductService };
