class NumberOfGroupsService {
  constructor({ pool, numberOfGroupsRepo }) {
    this.pool = pool;
    this.numberOfGroupsRepo = numberOfGroupsRepo;
  }

  async create({ id, type, date, hour, activity, groups }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (type === 'regular') {
        await this.numberOfGroupsRepo.upsertForRegular(date, hour, activity, groups, client);
      } else {
        await this.numberOfGroupsRepo.updateTourGroups(id, groups, client);
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

  async listAll() {
    return this.numberOfGroupsRepo.findAll();
  }
}

module.exports = { NumberOfGroupsService };
