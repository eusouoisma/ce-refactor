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

// Protected — authMiddleware runs first (token accepted via ?token= or Authorization header)
router.get('/getUser', (req, res) => {
  const { userId, username, name, permissions } = req.user;
  res.json({ userId, username, name, permissions });
});

router.post('/create', adminOnly, wrap(async (req, res) => {
  const { username, name, permissions, password } = req.body;
  res.json(await userService.create({ username, name, permissions, password }));
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

router.get('/logout-all', (req, res) => {
  res.json({ error: false });
});

module.exports = router;
