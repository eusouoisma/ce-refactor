class ChangeRequestService {
  constructor({ changeRequestRepo }) {
    this.changeRequestRepo = changeRequestRepo;
  }

  async getByTourId(tourId) {
    return this.changeRequestRepo.findByTourId(tourId);
  }
}

module.exports = { ChangeRequestService };
