class SettingsService {
  constructor({ settingsRepo }) {
    this.settingsRepo = settingsRepo;
  }

  async listAll() { return this.settingsRepo.findAll(); }
  async listByType(type) { return this.settingsRepo.findByType(type); }
  async getCurrentYear() { return this.settingsRepo.getCurrentYear(); }

  async create(type, value) {
    const year = await this.settingsRepo.getCurrentYear();
    await this.settingsRepo.insert(type, value, year);
    return { error: false };
  }

  async deleteSetting(id) {
    await this.settingsRepo.delete(id);
    return { error: false };
  }

  async updateCurrentYear(value) {
    await this.settingsRepo.updateCurrentYear(value);
    return { error: false };
  }
}

module.exports = { SettingsService };
