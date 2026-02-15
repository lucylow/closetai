/**
 * Cache layer — Redis with NodeCache fallback.
 * Use for distributed caching (e.g. trend results across instances).
 */
let redis = null;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;

if (redisUrl) {
  try {
    const IORedis = require('ioredis');
    redis = new IORedis(redisUrl);
    redis.on('error', (e) => console.error('Redis error:', e.message));
  } catch (e) {
    console.warn('Redis not available (ioredis required):', e.message);
  }
} else if (redisHost) {
  try {
    const IORedis = require('ioredis');
    redis = new IORedis({
      host: redisHost,
      port: parseInt(redisPort, 10),
    });
    redis.on('error', (e) => console.error('Redis error:', e.message));
  } catch (e) {
    console.warn('Redis not available:', e.message);
  }
}

function getRedisClient() {
  return redis;
}

/**
 * Get from Redis, return null if not found or error.
 */
async function redisGet(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/**
 * Set in Redis with TTL (seconds). Returns true on success.
 */
async function redisSet(key, value, ttlSeconds) {
  if (!redis) return false;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

module.exports = { getRedisClient, redisGet, redisSet };
