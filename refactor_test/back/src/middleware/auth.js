// NOTE: The legacy system uses a simple token stored in DB (not JWT).
// We replicate the same token-based auth logic from getUser.php
const { pool } = require('../db');

const TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4 hours sliding window

async function authMiddleware(req, res, next) {
  const token = req.headers['authorization'] || req.query.token;
  if (!token) {
    return res.status(401).json({ error: true, message: 'No token provided' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id as "userId", u.username, u.name, u.permissions, t."creationDate"
       FROM tokens t
       INNER JOIN users u ON t."userId" = u.id
       WHERE t.token = $1 AND u.deleted = 0`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: 'Invalid token' });
    }

    const row = result.rows[0];
    const creationDate = new Date(row.creationDate);
    const now = new Date();
    const diffSeconds = (now - creationDate) / 1000;

    if (diffSeconds > TOKEN_TTL_SECONDS) {
      // Delete all tokens for this user
      await pool.query(`DELETE FROM tokens WHERE "userId" = $1`, [row.userId]);
      return res.status(401).json({ error: true, message: 'Token expired' });
    }

    // Refresh token (sliding window)
    await pool.query(`UPDATE tokens SET "creationDate" = NOW() WHERE token = $1`, [token]);

    req.user = {
      userId: row.userId,
      username: row.username,
      name: row.name,
      permissions: row.permissions,
    };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: true, message: 'Auth error' });
  }
}

module.exports = { authMiddleware };
