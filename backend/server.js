const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const sequelize = require('./config/database');
require('./jobs/imageProcessingQueue');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
