class ReportService {
  constructor({ reportRepo }) {
    this.reportRepo = reportRepo;
  }

  _addRankings(rows) {
    const totalPax   = rows.reduce((s, r) => s + parseInt(r.totalPax || 0), 0);
    const totalValor = rows.reduce((s, r) => s + parseFloat(r.valorTotal || 0), 0);
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      paxPercent:   totalPax   ? ((parseInt(r.totalPax || 0)   / totalPax)   * 100).toFixed(1) : '0',
      valorPercent: totalValor ? ((parseFloat(r.valorTotal || 0) / totalValor) * 100).toFixed(1) : '0',
    }));
  }

  async analysisByCountry({ startDate, endDate, orderBy, from, to }) {
    const rows = this._addRankings(await this.reportRepo.analysisByCountry(startDate, endDate, orderBy));
    return rows.slice(from || 0, to || rows.length);
  }

  async analysisByCustomers({ startDate, endDate, clientSearch, orderBy, from, to }) {
    const rows = this._addRankings(await this.reportRepo.analysisByCustomers(startDate, endDate, clientSearch, orderBy));
    return rows.slice(from || 0, to || rows.length);
  }

  async analysisByProduct({ startDate, endDate, orderBy, from, to }) {
    const rows = this._addRankings(await this.reportRepo.analysisByProduct(startDate, endDate, orderBy));
    return rows.slice(from || 0, to || rows.length);
  }

  async analysisByHour({ startDate, endDate, day, activities }) {
    const data = await this.reportRepo.analysisByHour(startDate, endDate, day, activities);
    return { data, debug: {} };
  }

  async analysisByWeekday({ startDate, endDate, activities }) {
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const rows = await this.reportRepo.analysisByWeekday(startDate, endDate, activities);
    const dataMap = {};
    rows.forEach(r => { dataMap[r.dow] = parseInt(r.total); });
    const data = dayNames.map((name, i) => ({ dia: name, total: dataMap[i] || 0 }));
    return { data, debug: {} };
  }

  async analysisRegularTour({ startDate, endDate }) {
    return this.reportRepo.analysisRegularTour(startDate, endDate);
  }

  availableActivities() {
    return ['Regular', 'Tour 1', 'Mix Tour 1'];
  }
}

module.exports = { ReportService };
