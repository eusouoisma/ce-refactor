const { formatDate } = require('../shared/db');

class DayOrderService {
  constructor({ pool, dayOrderRepo }) {
    this.pool = pool;
    this.dayOrderRepo = dayOrderRepo;
  }

  async listActive() {
    return this.dayOrderRepo.findActive();
  }

  async listById(dayOrderId) {
    const dayOrder = await this.dayOrderRepo.findById(dayOrderId);
    if (!dayOrder) throw Object.assign(new Error('Not found'), { status: 404 });

    const [prevId, nextId, guideNames] = await Promise.all([
      this.dayOrderRepo.findPrev(dayOrder.date),
      this.dayOrderRepo.findNext(dayOrder.date),
      this.dayOrderRepo.findGuideNamesFromTours(dayOrderId),
    ]);

    // Sync guide employees with tour data
    for (const guide of guideNames) {
      const existing = await this.dayOrderRepo.findGuideEmployee(dayOrderId, guide);
      if (!existing) {
        const phone = await this.dayOrderRepo.findEmployeePhone(guide);
        await this.dayOrderRepo.insertGuideEmployee(dayOrderId, guide, phone);
      }
    }
    const currentGuides = await this.dayOrderRepo.findCurrentGuides(dayOrderId);
    for (const emp of currentGuides) {
      if (!guideNames.includes(emp.name)) {
        await this.dayOrderRepo.softDeleteEmployee(emp.id);
      }
    }

    // Auto-insert fixed employees on first load
    if (dayOrder.autoInserted == 0 && (dayOrder.name === 'Tour Principal' || dayOrder.name === 'Regular')) {
      const fixed = await this.dayOrderRepo.findFixedEmployees();
      for (const emp of fixed) {
        await this.dayOrderRepo.insertEmployee(dayOrderId, emp.function, emp.name, emp.phone);
      }
      await this.dayOrderRepo.markAutoInserted(dayOrderId);
    }

    const employees = await this.dayOrderRepo.findEmployeesForDayOrder(dayOrderId);

    return {
      error: false,
      infos: { ...dayOrder, formatedDate: formatDate(dayOrder.date), prev: prevId, next: nextId },
      employees,
    };
  }

  async listToursByDayOrderId(id) {
    const { nonRegular, regular } = await this.dayOrderRepo.findToursByDayOrderId(id);
    const combined = [...nonRegular, ...regular]
      .sort((a, b) => (a.tourHour || '') < (b.tourHour || '') ? -1 : 1)
      .map(r => {
        const guides = r.guides
          ? [...new Set(r.guides.split(',').map(g => g.trim()).filter(Boolean))].join(',')
          : '';
        return { ...r, guides };
      });
    return { error: false, data: combined };
  }

  async listToursByDate(date) {
    const data = await this.dayOrderRepo.findToursByDate(date);
    return { error: false, data };
  }

  async listAllPayments(year, months) {
    return this.dayOrderRepo.findAllPayments(year, months);
  }

  async listActivities() { return this.dayOrderRepo.findActivities(); }
  async listFunctions() { return this.dayOrderRepo.findFunctions(); }
  async listEmployeesOptions() { return this.dayOrderRepo.findEmployeesList(); }
  async listRemunerations() { return this.dayOrderRepo.findRemunerations(); }

  async createEmployee(dayOrderId, editedBy, employee) {
    await this.dayOrderRepo.updateDayOrderEditor(dayOrderId, editedBy);
    const id = await this.dayOrderRepo.insertEmployee(dayOrderId, employee?.function, employee?.name, employee?.phone);
    return { error: false, data: id };
  }

  async createEmployeeOption(fn, type, name, phone) {
    const exists = await this.dayOrderRepo.employeeOptionExists(name, fn);
    if (exists) return { error: true, message: 'Já existe um colaborador cadastrado com esse nome e função.' };
    const id = await this.dayOrderRepo.insertEmployeeOption(fn, type, name, phone);
    return { error: false, data: id };
  }

  async createFunction(name, orderNumber) {
    await this.dayOrderRepo.insertFunction(name, orderNumber);
    return { error: false };
  }

  async createRemuneration(data) {
    await this.dayOrderRepo.insertRemuneration(data);
    return { error: false };
  }

  async updateEmployees(dayOrderId, comments, lastEditBy, employees) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const emp of (employees || [])) {
        if (emp.deleted == 1 || emp.function === '') {
          await this.dayOrderRepo.softDeleteEmployee(emp.id);
        } else {
          await this.dayOrderRepo.updateEmployee(emp);
        }
      }
      await this.dayOrderRepo.updateDayOrder(dayOrderId, comments, lastEditBy);
      await client.query('COMMIT');
      return { error: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteEmployee(id) {
    await this.dayOrderRepo.deleteEmployeeOption(id);
    return { error: false };
  }

  async deleteFunction(id) {
    await this.dayOrderRepo.deleteFunction(id);
    return { error: false };
  }

  async deleteRemuneration(id) {
    await this.dayOrderRepo.deleteRemuneration(id);
    return { error: false };
  }

  async editEmployeeOption(id, fn, type, name, phone) {
    await this.dayOrderRepo.updateEmployeeOption(id, fn, type, name, phone);
    return { error: false };
  }

  async editFunction(id, name, orderNumber) {
    await this.dayOrderRepo.updateFunction(id, name, orderNumber);
    return { error: false };
  }

  async calculatePayments(dayOrderId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const employees = await this.dayOrderRepo.findEmployeesWithType(dayOrderId);
      await this.dayOrderRepo.clearPayments(dayOrderId, client);

      for (const emp of employees) {
        if (emp.empType === 'Fixo') continue;
        const payments = [];

        if (emp.function === 'Guia') {
          const tours = await this.dayOrderRepo.findGuideToursInDayOrder(dayOrderId, emp.name);
          for (const tour of tours) {
            const rem = await this.dayOrderRepo.findRemunerationForGuide(tour.activity);
            if (!rem) {
              throw new Error(`Não foi possível gerar os pagamentos pois a atividade ${tour.activity} não possui o salário cadastrado`);
            }
            payments.push({ function: emp.function, employeeName: emp.name, arrival: emp.arrival || '', departure: emp.departure || '', value: rem.hourlyValue1, activity: tour.activity, tourHour: tour.tourHour });
          }
        } else {
          const rem = await this.dayOrderRepo.findRemunerationForFunction(emp.function);
          if (!rem) {
            throw new Error(`Não foi possível gerar os pagamentos pois a função ${emp.function} não possui o salário cadastrado`);
          }
          let value = 0;
          if (rem.paymentType === 'day') {
            let hours = 0;
            if (emp.arrival && emp.departure) {
              const [ah, am] = emp.arrival.split(':').map(Number);
              const [dh, dm] = emp.departure.split(':').map(Number);
              hours = (dh * 60 + dm - (ah * 60 + am)) / 60;
            }
            if (hours <= 8) value = rem.hourlyValue1;
            else if (hours <= 10) value = rem.hourlyValue2;
            else value = rem.hourlyValue3;
          } else if (rem.paymentType === 'hour') {
            let hours = 0;
            if (emp.arrival && emp.departure) {
              const [ah, am] = emp.arrival.split(':').map(Number);
              const [dh, dm] = emp.departure.split(':').map(Number);
              hours = (dh * 60 + dm - (ah * 60 + am)) / 60;
            }
            value = parseFloat(rem.hourlyValue1) * hours;
          }
          payments.push({ function: emp.function, employeeName: emp.name, arrival: emp.arrival || '', departure: emp.departure || '', value, activity: '', tourHour: '' });
        }

        for (const p of payments) {
          await this.dayOrderRepo.insertPayment({ ...p, dayOrderId, comments: '' }, client);
        }
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

  async changeIndividualPayment(paymentId, value) {
    await this.dayOrderRepo.updatePaymentValue(paymentId, value);
    return { error: false };
  }

  async changeIndividualComments(paymentId, comments) {
    await this.dayOrderRepo.updatePaymentComments(paymentId, comments);
    return { error: false };
  }

  async splitToursToAnotherDayOrder(activity, hour, date, language, dayOrderId, editedBy) {
    const dow = new Date(date + 'T00:00:00').getDay();
    const newDayOrderId = await this.dayOrderRepo.insertNewDayOrder(date, activity, dow, dayOrderId, editedBy);
    await this.dayOrderRepo.reassignToursToDayOrder(newDayOrderId, date, hour, activity, language);
    return { error: false };
  }

  async returnTourToOriginalDayOrder(activity, hour, date, language, dayOrderId) {
    let originalId = await this.dayOrderRepo.findOriginalDayOrder(dayOrderId);
    if (!originalId) originalId = await this.dayOrderRepo.findDayOrderByDateAndType(date, 'regular');
    if (!originalId) originalId = await this.dayOrderRepo.findDayOrderByDate(date);
    await this.dayOrderRepo.reassignToursToDayOrder(originalId, date, hour, activity, language);
    return { error: false, original: originalId };
  }

  async associateGuideToTour(guide, tourHour, activity, language, dayOrderId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.dayOrderRepo.clearAssociatedGuides(dayOrderId, tourHour, activity, language);
      const guides = Array.isArray(guide) ? guide : [guide];
      for (const g of guides) {
        await this.dayOrderRepo.insertAssociatedGuide(dayOrderId, tourHour, activity, language, g);
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
}

module.exports = { DayOrderService };
