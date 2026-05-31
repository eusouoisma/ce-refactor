const express = require('express');
const { numberOfGroupsService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/create', wrap(async (req, res) => {
  res.json(await numberOfGroupsService.create(req.body));
}));

router.get('/list-all', wrap(async (req, res) => {
  res.json(await numberOfGroupsService.listAll());
}));

module.exports = router;
