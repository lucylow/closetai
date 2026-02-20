const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = env.db.url
  ? new Sequelize(env.db.url, {
      dialect: 'postgres',
      logging: env.nodeEnv === 'development' ? console.log : false,
      dialectOptions: {
        ssl: env.db.url.includes('sslmode=require') ? { require: true, rejectUnauthorized: false } : false,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: 'postgres',
      logging: env.nodeEnv === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

module.exports = sequelize;
