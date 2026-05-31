const express = require('express');
const { reportService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/analysis-by-country',   wrap(async (req, res) => { res.json(await reportService.analysisByCountry(req.body)); }));
router.post('/analysis-by-customers', wrap(async (req, res) => { res.json(await reportService.analysisByCustomers(req.body)); }));
router.post('/analysis-by-product',   wrap(async (req, res) => { res.json(await reportService.analysisByProduct(req.body)); }));
router.post('/analysis-by-hour',      wrap(async (req, res) => { res.json(await reportService.analysisByHour(req.body)); }));
router.post('/analysis-by-weekday',   wrap(async (req, res) => { res.json(await reportService.analysisByWeekday(req.body)); }));
router.post('/analysis-regular-tour', wrap(async (req, res) => { res.json(await reportService.analysisRegularTour(req.body)); }));
router.get('/available-activities',   (req, res) => { res.json(reportService.availableActivities()); });

module.exports = router;
