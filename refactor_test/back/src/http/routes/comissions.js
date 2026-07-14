const express = require('express');
const { comissionService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/list-all', wrap(async (req, res) => {
  const { year, months, limit, offset, ...filters } = req.query;
  if (limit !== undefined || offset !== undefined) {
    res.json(await comissionService.listAllPaginated(year, months, filters, limit, offset));
  } else {
    res.json(await comissionService.listAll(year, months, filters));
  }
}));

router.get('/filter-options', wrap(async (req, res) => {
  const { year, months, column, ...filters } = req.query;
  res.json(await comissionService.filterOptions(year, months, filters, column));
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await comissionService.listById(req.query.comission_id));
}));

router.post('/update', wrap(async (req, res) => {
  res.json(await comissionService.update(req.query.id, req.body));
}));

router.get('/delete', wrap(async (req, res) => {
  res.json(await comissionService.softDelete(req.query.id));
}));

router.get('/pay', wrap(async (req, res) => {
  res.json(await comissionService.pay(req.query.id, req.query.lastEditBy));
}));

router.get('/unpay', wrap(async (req, res) => {
  res.json(await comissionService.unpay(req.query.id, req.query.lastEditBy));
}));

module.exports = router;
