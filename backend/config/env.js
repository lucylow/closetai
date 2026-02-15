const dotenv = require('dotenv');
dotenv.config();

const requiredEnv = ['PORT', 'DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  linode: {
    endpoint: process.env.LINODE_ENDPOINT,
    bucket: process.env.LINODE_BUCKET,
    accessKey: process.env.LINODE_ACCESS_KEY,
    secretKey: process.env.LINODE_SECRET_KEY,
  },
  openai: { apiKey: process.env.OPENAI_API_KEY },
  perfectCorp: {
    apiKey: process.env.PERFECT_CORP_API_KEY,
    apiSecret: process.env.PERFECT_CORP_API_SECRET,
  },
  youcom: { apiKey: process.env.YOUCOM_API_KEY },
  removeBg: { apiKey: process.env.REMOVE_BG_API_KEY },
  openWeatherMap: { apiKey: process.env.OPENWEATHERMAP_API_KEY },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
};
