const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const sequelize = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// Process-level handlers – register before any async code
process.on('uncaughtException', (err) => {
  logger.error({ message: 'UNCAUGHT EXCEPTION! Shutting down...', error: err.message, stack: err.stack });
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ message: 'UNHANDLED REJECTION! Shutting down...', reason: String(reason) });
  console.error('UNHANDLED REJECTION! Shutting down...', reason);
  process.exit(1);
});

require('./jobs/imageProcessingQueue');
require('./jobs/kiloAgentQueue');

const app = express();

app.use(cors({ origin: true, credentials: true }));

// Stripe webhook needs raw body - must be before express.json()
const bodyParser = require('body-parser');
app.post(
  '/api/billing/webhook',
  bodyParser.raw({ type: 'application/json' }),
  require('./routes/billing.webhook')
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/healthz', (req, res) => res.json({ status: 'ok' })); // K8s liveness
app.get('/ready', (req, res) => res.json({ status: 'ready' }));

// 404 handler for unmatched routes (must be before error handler)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

app.use(errorHandler);

const PORT = env.port || 5000;

sequelize
  .sync({ alter: env.nodeEnv === 'development' })
  .then(() => {
    logger.info('Database connected');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Database connection failed', err);
    process.exit(1);
  });
