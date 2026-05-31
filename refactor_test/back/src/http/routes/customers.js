const express = require('express');
const { customerService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

const FILTER_KEYS = ['customerName', 'customerType', 'contactName', 'contactContact', 'contactOffice', 'contactEmail'];

function parseFilters(query) {
  const filters = {};
  for (const k of FILTER_KEYS) {
    const raw = query[`f_${k}`];
    if (raw) filters[k] = String(raw).split('|');
  }
  return filters;
}

router.post('/create', wrap(async (req, res) => {
  res.json(await customerService.create(req.body));
}));

router.post('/update', wrap(async (req, res) => {
  res.json(await customerService.update(req.body));
}));

router.get('/delete', wrap(async (req, res) => {
  res.json(await customerService.deleteContact(req.query.id));
}));

router.get('/list-all', wrap(async (req, res) => {
  res.json(await customerService.listAll());
}));

router.get('/list-paginated', wrap(async (req, res) => {
  res.json(await customerService.listPaginated({
    filters: parseFilters(req.query),
    search: req.query.q || '',
    limit: req.query.limit,
    offset: req.query.offset,
  }));
}));

router.get('/filter-options', wrap(async (req, res) => {
  res.json(await customerService.filterOptions({
    filters: parseFilters(req.query),
    search: req.query.q || '',
    column: req.query.column || null,
  }));
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await customerService.listById(req.query.customer_id));
}));

router.get('/list-grouped', wrap(async (req, res) => {
  res.json(await customerService.listGrouped());
}));

module.exports = router;
