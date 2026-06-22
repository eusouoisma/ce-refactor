const express = require('express');
const { customerService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/create', wrap(async (req, res) => {
  res.json(await customerService.create(req.body));
}));

router.post('/update', wrap(async (req, res) => {
  res.json(await customerService.update(req.body));
}));

router.post('/add-contact', wrap(async (req, res) => {
  res.json(await customerService.addContact(req.body));
}));

router.get('/delete-contact', wrap(async (req, res) => {
  res.json(await customerService.deleteContact(req.query.id));
}));

// Legacy alias kept for compatibility
router.get('/delete', wrap(async (req, res) => {
  res.json(await customerService.deleteContact(req.query.id));
}));

router.get('/list-all', wrap(async (req, res) => {
  res.json(await customerService.listAll());
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await customerService.listById(req.query.customer_id));
}));

router.get('/list-grouped', wrap(async (req, res) => {
  res.json(await customerService.listGrouped());
}));

module.exports = router;
