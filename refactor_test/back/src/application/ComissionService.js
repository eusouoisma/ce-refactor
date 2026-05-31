class ComissionService {
  constructor({ comissionRepo }) {
    this.comissionRepo = comissionRepo;
  }

  async listAll(year, months) { return this.comissionRepo.findAll(year, months); }
  async listAllPaginated(year, months, limit, offset) { return this.comissionRepo.findAllPaginated(year, months, limit, offset); }
  async listById(id) { return this.comissionRepo.findById(id); }

  async update(id, data) {
    await this.comissionRepo.updateWithOrderRef(id, data);
    return { error: false };
  }

  async softDelete(id) {
    const tourId = await this.comissionRepo.softDelete(id);
    if (tourId) await this.comissionRepo.markTourUncommissioned(tourId);
    return { error: false };
  }

  async pay(id, lastEditBy) {
    await this.comissionRepo.setPaid(id, lastEditBy);
    return { error: false };
  }

  async unpay(id, lastEditBy) {
    await this.comissionRepo.setUnpaid(id, lastEditBy);
    return { error: false };
  }
}

module.exports = { ComissionService };
