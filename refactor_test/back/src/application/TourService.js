const { Tour } = require('../domain/entities/Tour');
const { getTodaySP, formatDate } = require('../shared/db');
const { AppError } = require('../shared/AppError');
const { randomUUID } = require('crypto');

class TourService {
  constructor({ pool, tourRepo, settingsRepo, dayOrderRepo, comissionRepo, changeRequestRepo, customerRepo, tourEditHistoryService }) {
    this.pool = pool;
    this.tourRepo = tourRepo;
    this.settingsRepo = settingsRepo;
    this.dayOrderRepo = dayOrderRepo;
    this.comissionRepo = comissionRepo;
    this.changeRequestRepo = changeRequestRepo;
    this.customerRepo = customerRepo;
    this.tourEditHistoryService = tourEditHistoryService;
  }

  _isTourRegularAndDateNotPassed(type, tourDate) {
    if (type !== 'regular') return false;
    return tourDate >= getTodaySP();
  }

  async create(data) {
    const t = Tour.coerce(data);

    if (!t.tourDate) return { error: true, message: 'A data do tour é obrigatória.' };

    // B2C: override client with platform, clear contact fields before insert
    if (data.clientType === 'b2c') {
      t.client = t.platform || '';
      t.clientName = '';
      t.clientContact = '';
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const currentYear = await this.settingsRepo.getCurrentYear();
      if (!t.orderRef) {
        t.orderRef = await this.settingsRepo.generateOrderRef(client);
      } else if (await this.tourRepo.existsByOrderRef(t.orderRef, client)) {
        await client.query('ROLLBACK');
        return { error: true, message: `Já existe um tour com o número de reserva "${t.orderRef}".` };
      }
      const dayOrderId = await this.dayOrderRepo.getOrCreate(t.tourDate, client);
      const tourId = await this.tourRepo.insert(t, currentYear, dayOrderId, client, data.planneId || null, null, data.planneSaleDate || null);

      await this.tourEditHistoryService.recordCreation(tourId, t.createdBy, 'office', client);

      if (t.commissioned === '1') {
        await this.comissionRepo.insert(tourId, t.orderRef, { ...data, comissionPaid: t.comissionPaid === '1' }, currentYear, client);
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

  _generateRecurrenceDates(baseDateStr, recurrence) {
    const { interval, unit, days, endDate } = recurrence;
    const base = new Date(baseDateStr + 'T12:00:00Z');
    const end  = new Date(endDate      + 'T12:00:00Z');
    const results = [];

    if (unit === 'day') {
      let cur = new Date(base);
      cur.setUTCDate(cur.getUTCDate() + Number(interval));
      while (cur <= end) {
        results.push(cur.toISOString().split('T')[0]);
        cur.setUTCDate(cur.getUTCDate() + Number(interval));
      }
    } else {
      // week — iterate each week (stepping interval weeks), emit selected days
      const baseDay = base.getUTCDay();
      const sunday  = new Date(base);
      sunday.setUTCDate(sunday.getUTCDate() - baseDay);

      for (let w = 0; w < 500; w++) {
        const ws = new Date(sunday);
        ws.setUTCDate(ws.getUTCDate() + w * 7 * Number(interval));
        if (ws > end) break;

        for (const day of [...days].sort((a, b) => a - b)) {
          const d = new Date(ws);
          d.setUTCDate(d.getUTCDate() + day);
          if (d > base && d <= end)
            results.push(d.toISOString().split('T')[0]);
        }
      }
    }

    return results;
  }

  async createRecurrence(data, recurrence) {
    const dates = this._generateRecurrenceDates(data.tourDate, recurrence);
    if (dates.length === 0)
      return { error: true, message: 'Nenhuma data gerada com os parâmetros informados.' };

    const recurrenceId  = randomUUID();
    const currentYear   = await this.settingsRepo.getCurrentYear();
    const client        = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const created = [];
      for (const date of dates) {
        const t       = Tour.coerce({ ...data, tourDate: date });
        t.orderRef    = await this.settingsRepo.generateOrderRef(client);
        const doId    = await this.dayOrderRepo.getOrCreate(date, client);
        const tourId  = await this.tourRepo.insert(t, currentYear, doId, client, null, recurrenceId);
        await this.tourEditHistoryService.recordCreation(tourId, t.createdBy, 'office', client);
        created.push(tourId);
      }
      await client.query('COMMIT');
      return { error: false, count: created.length, recurrenceId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const t = Tour.coerce(data);

    if (!t.tourDate) return { error: true, message: 'A data do tour é obrigatória.' };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const currentYear = await this.settingsRepo.getCurrentYear();
      const current = await this.tourRepo.findCurrentState(id, client);
      const currentForDiff = await this.tourRepo.findAllForDiff(id, client);
      const currentTourDate = current?.tourDate ? new Date(current.tourDate).toISOString().split('T')[0] : '';

      let dayOrderId;
      if (t.tourDate !== currentTourDate) {
        dayOrderId = await this.dayOrderRepo.getForDateChange(t.tourDate, client);
      } else {
        dayOrderId = current.dayOrderId;
      }

      const includeFinancial = this._isTourRegularAndDateNotPassed(t.type, t.tourDate);
      await this.tourRepo.update(id, t, dayOrderId, includeFinancial, client);

      await this.changeRequestRepo.deleteByTourId(id, client);
      for (const cr of (data.changeRequests || [])) {
        await this.changeRequestRepo.insert(id, cr, t.lastEditBy, client);
      }

      if (t.commissioned === '1') {
        const comData = { ...data, comissionPaid: t.comissionPaid === '1' };
        if (data.commissionId) {
          const existing = await this.comissionRepo.findById_linked(data.commissionId, client);
          if (!existing) {
            await this.comissionRepo.insert(id, t.orderRef, comData, currentYear, client);
          } else {
            await this.comissionRepo.update(data.commissionId, comData, client);
          }
        } else {
          await this.comissionRepo.insert(id, t.orderRef, comData, currentYear, client);
        }
      }

      if (currentForDiff) {
        await this.tourEditHistoryService.recordChanges(id, currentForDiff, t, t.lastEditBy, 'office', client);
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

  async listAll(year, months, filters) {
    return this.tourRepo.findAll(year, months, filters);
  }

  async listAllPaginated(year, months, filters, limit, offset) {
    return this.tourRepo.findAllPaginated(year, months, filters, limit, offset);
  }

  async filterOptions(year, months, filters, column) {
    return this.tourRepo.findFilterOptions(year, months, filters, column);
  }

  async listAllFinancial(year, months, filters) {
    return this.tourRepo.findAllFinancial(year, months, filters);
  }

  async listAllFinancialPaginated(year, months, filters, limit, offset) {
    const currentYear = await this.settingsRepo.getCurrentYear();
    return this.tourRepo.findAllFinancialPaginated(year, months, currentYear, filters, limit, offset);
  }

  async financialFilterOptions(year, months, filters, column) {
    const currentYear = await this.settingsRepo.getCurrentYear();
    return this.tourRepo.findFinancialFilterOptions(year, months, currentYear, filters, column);
  }

  async listAllSummaryPaginated(months, year, filters, limit, offset) {
    return this.tourRepo.findAllSummaryPaginated(months, year, filters, limit, offset);
  }

  async summaryFilterOptions(months, year, filters, column) {
    return this.tourRepo.findSummaryFilterOptions(months, year, filters, column);
  }

  async listAllSummary(months, year) {
    const rows = await this.tourRepo.findAllSummary(months, year);
    return rows
      .sort((a, b) => {
        if (a.tourDate < b.tourDate) return -1;
        if (a.tourDate > b.tourDate) return 1;
        return (a.tourHour || '') < (b.tourHour || '') ? -1 : 1;
      })
      .map(r => {
        const guides = r.guides
          ? [...new Set(r.guides.split(',').map(g => g.trim()).filter(Boolean))].join(',')
          : '';
        return { ...r, guides, formatedTourDate: formatDate(r.tourDate) };
      });
  }

  async listById(tourId) {
    const tour = await this.tourRepo.findById(tourId);
    if (!tour) throw new AppError('Not found', 404);
    tour.changeRequests = await this.changeRequestRepo.findByTourId(tourId);
    return tour;
  }

  async listCanceled(year, months) {
    return this.tourRepo.findCanceled(year, months);
  }

  async listCanceledPaginated(year, months, limit, offset) {
    return this.tourRepo.findCanceledPaginated(year, months, limit, offset);
  }

  async cancel(id, cancelReason, lastEditBy) {
    await this.tourRepo.cancel(id, cancelReason, lastEditBy);
    return { error: false };
  }

  async cancelMultiple(ids, cancelReason, lastEditBy) {
    const idArr = ids.split(',').map(Number);
    const result = await this.tourRepo.cancelMultiple(idArr, cancelReason, lastEditBy);
    return {
      error: false,
      affectedRows: result.rowCount,
      canceledIds: result.rows.map(r => r.id),
    };
  }

  async uncancel(id, lastEditBy) {
    await this.tourRepo.uncancel(id, lastEditBy);
    return { error: false };
  }

  async createFinancial(data) {
    const t = Tour.coerceFinancial(data);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const currentYear = await this.settingsRepo.getCurrentYear();
      if (!t.orderRef) t.orderRef = await this.settingsRepo.generateOrderRef(client);
      const dayOrderId = await this.dayOrderRepo.getOrCreate(t.tourDate, client);
      const tourId = await this.tourRepo.insertFinancial(t, currentYear, dayOrderId, client);

      await this.tourEditHistoryService.recordCreation(tourId, t.createdBy, 'office', client);

      if (t.commissioned === '1') {
        await this.comissionRepo.insert(tourId, t.orderRef, { ...data, comissionPaid: t.comissionPaid === '1' }, currentYear, client);
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

  async updateFinancial(id, data) {
    const t = Tour.coerceFinancial(data);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const currentYear = await this.settingsRepo.getCurrentYear();
      const current = await this.tourRepo.findCurrentState(id, client);
      const currentForDiff = await this.tourRepo.findAllForDiff(id, client);
      const currentTourDate = current?.tourDate ? new Date(current.tourDate).toISOString().split('T')[0] : '';

      let dayOrderId;
      if (t.tourDate !== currentTourDate) {
        dayOrderId = await this.dayOrderRepo.getForDateChange(t.tourDate, client);
      } else {
        dayOrderId = current.dayOrderId;
      }

      await this.tourRepo.updateFinancial(id, t, dayOrderId, client);

      await this.changeRequestRepo.deleteByTourId(id, client);
      for (const cr of (data.changeRequests || [])) {
        if (cr.approved) {
          await this.tourRepo.setField(id, cr.type, cr.newValue, client);
        } else if (!cr.approved && !cr.reproved) {
          await this.changeRequestRepo.insert(id, cr, t.lastEditBy, client);
        }
      }

      if (t.commissioned === '1') {
        const comData = { ...data, comissionPaid: t.comissionPaid === '1' };
        if (data.commissionId) {
          const existing = await this.comissionRepo.findById_linked(data.commissionId, client);
          if (!existing) {
            await this.comissionRepo.insert(id, t.orderRef, comData, currentYear, client);
          } else {
            await this.comissionRepo.updateWithOrderRef(data.commissionId, comData, client);
          }
        } else {
          await this.comissionRepo.insert(id, t.orderRef, comData, currentYear, client);
        }
      }

      if (currentForDiff) {
        await this.tourEditHistoryService.recordChanges(id, currentForDiff, t, t.lastEditBy, 'financial', client);
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

  async availableHours(date, type, status) {
    return this.tourRepo.findAvailableHours(date, type, status);
  }

  async listClientsByDateAndHour(date, hour) {
    const clients = await this.tourRepo.findClientsByDateAndHour(date, hour);
    return { error: false, clients };
  }

  async getEditHistory(tourId, type) {
    return this.tourEditHistoryService.getHistory(tourId, type || null);
  }

  async setCobrarCliente(id, lastEditBy) {
    const current = await this.tourRepo.findAllForDiff(id);
    if (!current) return { error: true, message: 'Tour não encontrado' };
    if ((current.company || '').toLowerCase().includes('cobrar cliente')) return { error: false };
    await this.tourRepo.setField(id, 'company', 'Cobrar Cliente');
    await this.tourEditHistoryService.recordChanges(
      id,
      { company: current.company || '' },
      { company: 'Cobrar Cliente' },
      lastEditBy || '',
      'financial'
    );
    return { error: false };
  }

  async markAsLateCheck(id, lastEditBy) {
    await this.tourRepo.markLateCheck(id, lastEditBy);
    return { error: false };
  }

  async regularList(date, hour) {
    const rows = await this.tourRepo.findRegularList(date, hour);
    return rows.map(r => ({
      n: r.n,
      guideAgency: r.client,
      adulto: r.paxAdult,
      net: r.paxNet,
      brasileiro: r.paxBrazilian,
      meia: r.paxHalf,
      free: r.paxFree,
      total: (parseInt(r.paxAdult)||0) + (parseInt(r.paxNet)||0) + (parseInt(r.paxBrazilian)||0) + (parseInt(r.paxHalf)||0) + (parseInt(r.paxFree)||0),
      nomePax: r.clientName,
      guia: r.companionName,
      paymentMethod: r.paymentMethod,
      valorTotal: r.totalValue,
      comissao: r.commissioned == 1 ? 'Sim' : 'Não',
      statusPgto: r.paymentStatus,
      obs: r.comments,
    }));
  }
}

module.exports = { TourService };
