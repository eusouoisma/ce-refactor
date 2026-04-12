const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, username, name, permissions, password FROM users WHERE username = $1 AND deleted = 0`,
      [username]
    );
    if (result.rows.length === 0) {
      return res.json({ error: 'Username or password is wrong' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ error: 'Username or password is wrong' });
    }
    // Delete old tokens and create new one
    await pool.query(`DELETE FROM tokens WHERE "userId" = $1`, [user.id]);
    const token = crypto.randomBytes(20).toString('hex'); // 40 char hex
    await pool.query(`INSERT INTO tokens ("userId", token, "creationDate") VALUES ($1, $2, NOW())`, [user.id, token]);
    res.json({ error: false, token, permissions: user.permissions });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /users/getUser
router.get('/getUser', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.json({ error: true });
  try {
    const result = await pool.query(
      `SELECT u.id as "userId", u.username, u.name, u.permissions, t."creationDate"
       FROM tokens t INNER JOIN users u ON t."userId" = u.id
       WHERE t.token = $1 AND u.deleted = 0`,
      [token]
    );
    if (result.rows.length === 0) return res.json({ error: true });
    const row = result.rows[0];
    const diffSeconds = (new Date() - new Date(row.creationDate)) / 1000;
    if (diffSeconds > 14400) {
      await pool.query(`DELETE FROM tokens WHERE "userId" = $1`, [row.userId]);
      return res.json({ error: true });
    }
    await pool.query(`UPDATE tokens SET "creationDate" = NOW() WHERE token = $1`, [token]);
    res.json({
      username: row.username,
      name: row.name,
      permissions: row.permissions,
      creationDate: row.creationDate,
      userId: row.userId,
    });
  } catch (err) {
    res.json({ error: true });
  }
});

// POST /users/create
router.post('/create', async (req, res) => {
  const { username, name, permissions, password } = req.body;
  try {
    const existing = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (existing.rows.length > 0) {
      return res.json({ error: 'A user with that username already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (username, name, permissions, password) VALUES ($1, $2, $3, $4)`,
      [username, name, permissions, hash]
    );
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// POST /users/update
router.post('/update', async (req, res) => {
  const { username, name, token, password } = req.body;
  try {
    const tokenRes = await pool.query(`SELECT "userId" FROM tokens WHERE token = $1`, [token]);
    if (tokenRes.rows.length === 0) return res.json({ error: 'Something went wrong' });
    const userId = tokenRes.rows[0].userId;
    if (password && password !== '') {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE users SET username = $1, name = $2, password = $3 WHERE id = $4`, [username, name, hash, userId]);
    } else {
      await pool.query(`UPDATE users SET username = $1, name = $2 WHERE id = $3`, [username, name, userId]);
    }
    res.json({ error: false });
  } catch (err) {
    res.json({ error: 'Something went wrong' });
  }
});

// GET /users/delete
router.get('/delete', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

// GET /users/list-all
router.get('/list-all', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, username, name, permissions FROM users WHERE deleted = 0`);
    res.json(result.rows);
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// GET /users/logout-all
router.get('/logout-all', async (req, res) => {
  try {
    await pool.query(`DELETE FROM tokens WHERE 1=1`);
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true });
  }
});

module.exports = router;
