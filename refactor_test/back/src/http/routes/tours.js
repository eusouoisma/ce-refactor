const express = require('express');
const { tourService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/create', wrap(async (req, res) => {
  res.json(await tourService.create(req.body));
}));

router.post('/create-recurrence', wrap(async (req, res) => {
  const { tourData, recurrence } = req.body;
  res.json(await tourService.createRecurrence(tourData, recurrence));
}));

router.post('/update', wrap(async (req, res) => {
  res.json(await tourService.update(req.query.id, req.body));
}));

router.get('/list-all', wrap(async (req, res) => {
  const { year, months, limit, offset, ...filters } = req.query;
  if (limit !== undefined || offset !== undefined) {
    res.json(await tourService.listAllPaginated(year, months, filters, limit, offset));
  } else {
    res.json(await tourService.listAll(year, months, filters));
  }
}));

router.get('/filter-options', wrap(async (req, res) => {
  const { year, months, column, ...filters } = req.query;
  res.json(await tourService.filterOptions(year, months, filters, column));
}));

router.get('/list-all-financial', wrap(async (req, res) => {
  const { year, months, limit, offset, ...filters } = req.query;
  if (limit !== undefined || offset !== undefined) {
    res.json(await tourService.listAllFinancialPaginated(year, months, filters, limit, offset));
  } else {
    res.json(await tourService.listAllFinancial(year, months, filters));
  }
}));

router.get('/financial-filter-options', wrap(async (req, res) => {
  const { year, months, column, ...filters } = req.query;
  res.json(await tourService.financialFilterOptions(year, months, filters, column));
}));

router.get('/list-all-summary', wrap(async (req, res) => {
  const { year, months, limit, offset, ...filters } = req.query;
  if (limit !== undefined || offset !== undefined) {
    res.json(await tourService.listAllSummaryPaginated(months, year, filters, limit, offset));
  } else {
    res.json(await tourService.listAllSummary(months, year));
  }
}));

router.get('/summary-filter-options', wrap(async (req, res) => {
  const { year, months, column, ...filters } = req.query;
  res.json(await tourService.summaryFilterOptions(months, year, filters, column));
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await tourService.listById(req.query.tour_id));
}));

router.get('/list-canceled', wrap(async (req, res) => {
  const { year, months, limit, offset } = req.query;
  if (limit !== undefined || offset !== undefined) {
    res.json(await tourService.listCanceledPaginated(year, months, limit, offset));
  } else {
    res.json(await tourService.listCanceled(year, months));
  }
}));

router.post('/cancel', wrap(async (req, res) => {
  const { cancelReason, lastEditBy } = req.body;
  res.json(await tourService.cancel(req.query.id, cancelReason, lastEditBy));
}));

router.post('/cancel-multiple', wrap(async (req, res) => {
  const { cancelReason, lastEditBy } = req.body;
  res.json(await tourService.cancelMultiple(req.query.ids, cancelReason, lastEditBy));
}));

router.post('/uncancel', wrap(async (req, res) => {
  res.json(await tourService.uncancel(req.query.id, req.body.lastEditBy));
}));

router.post('/create-financial', wrap(async (req, res) => {
  res.json(await tourService.createFinancial(req.body));
}));

router.post('/update-financial', wrap(async (req, res) => {
  res.json(await tourService.updateFinancial(req.query.id, req.body));
}));

router.get('/available-hours', wrap(async (req, res) => {
  const { date, type, status } = req.query;
  res.json(await tourService.availableHours(date, type, status));
}));

router.get('/list-clients-by-date-and-hour', wrap(async (req, res) => {
  const { date, hour } = req.query;
  res.json(await tourService.listClientsByDateAndHour(date, hour));
}));

router.post('/mark-as-late-check', wrap(async (req, res) => {
  res.json(await tourService.markAsLateCheck(req.query.id, req.body.lastEditBy));
}));

router.get('/regular-list', wrap(async (req, res) => {
  const { date, hour } = req.query;
  res.json(await tourService.regularList(date, hour));
}));

router.post('/set-cobrar-cliente', wrap(async (req, res) => {
  res.json(await tourService.setCobrarCliente(req.query.id, req.body.lastEditBy));
}));

router.get('/edit-history', wrap(async (req, res) => {
  const { tour_id, type } = req.query;
  res.json(await tourService.getEditHistory(tour_id, type));
}));

module.exports = router;
