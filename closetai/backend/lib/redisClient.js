/**
 * Redis client for rate limiting and Bull queues.
 * Uses REDIS_URL or falls back to REDIS_HOST/REDIS_PORT from env.
 */
const env = require('../config/env');

function createClient() {
  const Redis = require('ioredis');
  const url = env.redis?.url || process.env.REDIS_URL;
  const opts = url
    ? { url }
    : {
        host: env.redis?.host || 'localhost',
        port: env.redis?.port || 6379,
        retryStrategy: () => null,
        maxRetriesPerRequest: 1,
      };
  const client = new Redis(opts);
  client.on('error', (e) => console.error('Redis error', e.message));
  return client;
}

const client = createClient();

module.exports = client;
