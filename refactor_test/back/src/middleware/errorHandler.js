function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: true, message: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
