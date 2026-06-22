class CustomerService {
  constructor({ pool, customerRepo }) {
    this.pool = pool;
    this.customerRepo = customerRepo;
  }

  async create(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const customerId = await this.customerRepo.insert(data, client);
      for (const c of (data.contacts || [])) {
        await this.customerRepo.insertContact(customerId, { ...c, createdBy: data.createdBy, lastEditBy: data.lastEditBy }, client);
      }
      await client.query('COMMIT');
      return { error: false, customerId };
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
      await this.customerRepo.update(data.customerId, data, client);
      await client.query('COMMIT');
      return { error: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async addContact(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.customerRepo.insertContact(data.customerId, { ...data, createdBy: data.createdBy, lastEditBy: data.lastEditBy }, client);
      await client.query('COMMIT');
      return { error: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteContact(id) {
    await this.customerRepo.deleteContact(id);
    return { error: false };
  }

  async listAll()         { return this.customerRepo.findAll(); }
  async listById(id)      { return this.customerRepo.findById(id); }
  async listGrouped()     { return this.customerRepo.findGrouped(); }
}

module.exports = { CustomerService };
