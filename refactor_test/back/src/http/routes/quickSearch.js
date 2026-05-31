const express = require('express');
const { quickSearchService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/search', wrap(async (req, res) => {
  const { reserva, cliente } = req.body;
  res.json(await quickSearchService.search(reserva, cliente));
}));

router.post('/search-tours', wrap(async (req, res) => {
  const { reserva, cliente } = req.body;
  res.json(await quickSearchService.searchTours(reserva, cliente));
}));

module.exports = router;
