const express = require('express');
const { dayOrderService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/list-active', wrap(async (req, res) => {
  res.json(await dayOrderService.listActive());
}));

router.get('/list-by-id', wrap(async (req, res) => {
  res.json(await dayOrderService.listById(req.query.day_order_id));
}));

router.get('/list-tours-by-dayorder-id', wrap(async (req, res) => {
  res.json(await dayOrderService.listToursByDayOrderId(req.query.id));
}));

router.get('/list-tours-by-date', wrap(async (req, res) => {
  res.json(await dayOrderService.listToursByDate(req.query.date));
}));

router.get('/list-all-payments', wrap(async (req, res) => {
  res.json(await dayOrderService.listAllPayments(req.query.year, req.query.months));
}));

router.post('/list-activities', wrap(async (req, res) => {
  res.json(await dayOrderService.listActivities());
}));

router.get('/list-functions', wrap(async (req, res) => {
  res.json(await dayOrderService.listFunctions());
}));

router.get('/list-employees-options', wrap(async (req, res) => {
  res.json(await dayOrderService.listEmployeesOptions());
}));

router.get('/list-remunerations', wrap(async (req, res) => {
  res.json(await dayOrderService.listRemunerations());
}));

router.post('/create-employee', wrap(async (req, res) => {
  const { dayOrderId, editedBy, employee } = req.body;
  res.json(await dayOrderService.createEmployee(dayOrderId, editedBy, employee));
}));

router.post('/create-employee-option', wrap(async (req, res) => {
  const { function: fn, type, name, phone } = req.body;
  res.json(await dayOrderService.createEmployeeOption(fn, type, name, phone));
}));

router.post('/create-function', wrap(async (req, res) => {
  const { name, orderNumber } = req.body;
  res.json(await dayOrderService.createFunction(name, orderNumber));
}));

router.post('/create-remuneration', wrap(async (req, res) => {
  res.json(await dayOrderService.createRemuneration(req.body));
}));

router.post('/update-employees', wrap(async (req, res) => {
  const { dayOrderId, comments, lastEditBy, employees } = req.body;
  res.json(await dayOrderService.updateEmployees(dayOrderId, comments, lastEditBy, employees));
}));

router.get('/delete-employee', wrap(async (req, res) => {
  res.json(await dayOrderService.deleteEmployee(req.query.id));
}));

router.get('/delete-function', wrap(async (req, res) => {
  res.json(await dayOrderService.deleteFunction(req.query.id));
}));

router.get('/delete-remuneration', wrap(async (req, res) => {
  res.json(await dayOrderService.deleteRemuneration(req.query.id));
}));

router.post('/edit-employee-option', wrap(async (req, res) => {
  const { id, function: fn, type, name, phone } = req.body;
  res.json(await dayOrderService.editEmployeeOption(id, fn, type, name, phone));
}));

router.post('/edit-function', wrap(async (req, res) => {
  const { id, name, orderNumber } = req.body;
  res.json(await dayOrderService.editFunction(id, name, orderNumber));
}));

router.post('/calculate-payments', wrap(async (req, res) => {
  res.json(await dayOrderService.calculatePayments(req.body.dayOrderId));
}));

router.post('/change-individual-payment', wrap(async (req, res) => {
  res.json(await dayOrderService.changeIndividualPayment(req.body.paymentId, req.body.paymentNewValue));
}));

router.post('/change-individual-comments', wrap(async (req, res) => {
  res.json(await dayOrderService.changeIndividualComments(req.body.paymentId, req.body.commentsNewValue));
}));

router.post('/split-tours-to-another-day-order', wrap(async (req, res) => {
  const { activity, hour, date, language, dayOrderId, editedBy } = req.body;
  res.json(await dayOrderService.splitToursToAnotherDayOrder(activity, hour, date, language, dayOrderId, editedBy));
}));

router.post('/return-tour-to-original-day-order', wrap(async (req, res) => {
  const { activity, hour, date, language, dayOrderId } = req.body;
  res.json(await dayOrderService.returnTourToOriginalDayOrder(activity, hour, date, language, dayOrderId));
}));

router.post('/associate-guide-to-tour', wrap(async (req, res) => {
  const { guide, tourHour, activity, language, dayOrderId } = req.body;
  res.json(await dayOrderService.associateGuideToTour(guide, tourHour, activity, language, dayOrderId));
}));

module.exports = router;
