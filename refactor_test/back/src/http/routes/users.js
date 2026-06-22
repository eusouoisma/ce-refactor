const express = require('express');
const { userService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

function adminOnly(req, res, next) {
  if (![4, 5].includes(Number(req.user.permissions))) {
    return res.status(403).json({ error: true, message: 'Forbidden' });
  }
  next();
}

router.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body;
  res.json(await userService.login(username, password));
}));

router.post('/verify-2fa', wrap(async (req, res) => {
  const { userId, code } = req.body;
  res.json(await userService.verify2fa(userId, code));
}));

// Protected — authMiddleware runs first (token accepted via ?token= or Authorization header)
router.get('/getUser', (req, res) => {
  const { userId, username, name, permissions } = req.user;
  res.json({ userId, username, name, permissions });
});

router.post('/create', adminOnly, wrap(async (req, res) => {
  const { username, name, permissions, password, email } = req.body;
  res.json(await userService.create({ username, name, permissions, password, email }));
}));

router.post('/update', wrap(async (req, res) => {
  const { username, name, password } = req.body;
  res.json(await userService.updateSelf(req.user.userId, { username, name, password }));
}));

router.get('/delete', adminOnly, wrap(async (req, res) => {
  res.json(await userService.deleteUser(req.query.id));
}));

router.get('/list-all', adminOnly, wrap(async (req, res) => {
  res.json(await userService.listAll());
}));

router.get('/shortcuts', wrap(async (req, res) => {
  const shortcuts = await userService.getShortcuts(req.user.userId);
  res.json({ shortcuts });
}));

router.post('/shortcuts', wrap(async (req, res) => {
  const result = await userService.updateShortcuts(req.user.userId, req.body?.shortcuts);
  res.json(result);
}));

router.get('/logout-all', (req, res) => {
  res.json({ error: false });
});

module.exports = router;
