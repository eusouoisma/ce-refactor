const express = require('express');
const { settingsService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/list-all', wrap(async (req, res) => {
  res.json(await settingsService.listAll());
}));

router.post('/create', wrap(async (req, res) => {
  const { type, value } = req.body;
  res.json(await settingsService.create(type, value));
}));

router.get('/delete', wrap(async (req, res) => {
  res.json(await settingsService.deleteSetting(req.query.id));
}));

router.post('/update-current-year', wrap(async (req, res) => {
  res.json(await settingsService.updateCurrentYear(req.body.value));
}));

router.get('/current-year', wrap(async (req, res) => {
  res.json(await settingsService.getCurrentYear());
}));

const makeTypeRoute = (type) => wrap(async (req, res) => {
  res.json(await settingsService.listByType(type));
});

router.get('/activities',      makeTypeRoute('activity'));
router.get('/platforms',       makeTypeRoute('platform'));
router.get('/languages',       makeTypeRoute('language'));
router.get('/status',          makeTypeRoute('status'));
router.get('/currencies',      makeTypeRoute('currency'));
router.get('/payment-methods', makeTypeRoute('paymentMethod'));
router.get('/payment-status',  makeTypeRoute('paymentStatus'));
router.get('/locals',          makeTypeRoute('local'));
router.get('/guides',          makeTypeRoute('guide'));
router.get('/companies',       makeTypeRoute('company'));
router.get('/account-numbers', makeTypeRoute('accountNumber'));
router.get('/countries',       makeTypeRoute('country'));

module.exports = router;
