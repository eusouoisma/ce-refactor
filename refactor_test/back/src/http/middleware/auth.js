const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '4h' });
}

function authMiddleware(req, res, next) {
  const raw = req.headers['authorization'] || req.query.token || '';
  const token = raw.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: true, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware, signToken };
