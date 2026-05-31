const express = require('express');
const { changeRequestService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/get-by-tour-id', wrap(async (req, res) => {
  res.json(await changeRequestService.getByTourId(req.query.tour_id));
}));

module.exports = router;
