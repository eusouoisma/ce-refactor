require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const usersRouter = require('./routes/users');
const toursRouter = require('./routes/tours');
const customersRouter = require('./routes/customers');
const comissionsRouter = require('./routes/comissions');
const productsRouter = require('./routes/products');
const settingsRouter = require('./routes/settings');
const dayOrderRouter = require('./routes/dayOrder');
const reportsRouter = require('./routes/reports');
const quickSearchRouter = require('./routes/quickSearch');
const changeRequestsRouter = require('./routes/changeRequests');
const numberOfGroupsRouter = require('./routes/numberOfGroups');

const app = express();

// CORS - fully open like the PHP legacy
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', usersRouter);
app.use('/tours', toursRouter);
app.use('/customers', customersRouter);
app.use('/comissions', comissionsRouter);
app.use('/products', productsRouter);
app.use('/settings', settingsRouter);
app.use('/day-order', dayOrderRouter);
app.use('/reports', reportsRouter);
app.use('/quick-search', quickSearchRouter);
app.use('/changeRequests', changeRequestsRouter);
app.use('/numberOfGroups', numberOfGroupsRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CE Backend running on port ${PORT}`);
});

module.exports = app;
