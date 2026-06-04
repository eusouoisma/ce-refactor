const express = require('express');
const { planneSyncService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/available-tours', wrap(async (req, res) => {
  res.json(await planneSyncService.getAvailableTours());
}));

module.exports = router;
