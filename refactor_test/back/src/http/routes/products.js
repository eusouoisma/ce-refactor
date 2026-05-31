const express = require('express');
const { productService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/create', wrap(async (req, res) => {
  res.json(await productService.create(req.body));
}));

router.post('/update', wrap(async (req, res) => {
  res.json(await productService.update(req.body));
}));

router.get('/delete', wrap(async (req, res) => {
  res.json(await productService.deleteProduct(req.query.id));
}));

router.get('/list-all', wrap(async (req, res) => {
  res.json(await productService.listAll());
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await productService.listById(req.query.product_id));
}));

module.exports = router;
