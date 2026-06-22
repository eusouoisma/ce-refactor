require('dotenv').config();
const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
  console.error('Missing required env var: JWT_SECRET');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Missing required env var: DATABASE_URL');
  process.exit(1);
}

const { errorHandler } = require('./http/middleware/errorHandler');
const { authMiddleware } = require('./http/middleware/auth');

const usersRouter        = require('./http/routes/users');
const toursRouter        = require('./http/routes/tours');
const customersRouter    = require('./http/routes/customers');
const comissionsRouter   = require('./http/routes/comissions');
const productsRouter     = require('./http/routes/products');
const settingsRouter     = require('./http/routes/settings');
const dayOrderRouter     = require('./http/routes/dayOrder');
const reportsRouter      = require('./http/routes/reports');
const quickSearchRouter  = require('./http/routes/quickSearch');
const changeRequestsRouter = require('./http/routes/changeRequests');
const numberOfGroupsRouter = require('./http/routes/numberOfGroups');
const aiChatRouter         = require('./http/routes/aiChat');
const planneRouter         = require('./http/routes/planne');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PUBLIC = [
  { method: 'POST', path: '/users/login' },
  { method: 'POST', path: '/users/verify-2fa' },
  { method: 'GET',  path: '/health' },
];

app.use((req, res, next) => {
  const isPublic = PUBLIC.some(p => p.method === req.method && req.path === p.path);
  if (isPublic) return next();
  authMiddleware(req, res, next);
});

app.use('/users',          usersRouter);
app.use('/tours',          toursRouter);
app.use('/customers',      customersRouter);
app.use('/comissions',     comissionsRouter);
app.use('/products',       productsRouter);
app.use('/settings',       settingsRouter);
app.use('/day-order',      dayOrderRouter);
app.use('/reports',        reportsRouter);
app.use('/quick-search',   quickSearchRouter);
app.use('/changeRequests', changeRequestsRouter);
app.use('/numberOfGroups', numberOfGroupsRouter);
app.use('/ai-chat',        aiChatRouter);
app.use('/planne',         planneRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CE Backend running on port ${PORT}`);
});

module.exports = app;
