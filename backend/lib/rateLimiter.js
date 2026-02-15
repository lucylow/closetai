/**
 * Token-bucket rate limiter using Redis.
 * Use for per-user/per-endpoint rate limiting.
 */
const redis = require('../utils/redis');

/**
 * Token bucket: increment counter, return remaining tokens.
 * @param {string} key - Redis key (e.g. usage:userId)
 * @param {number} limit - Max requests per window
 * @param {number} windowSeconds - Window size in seconds
 * @returns {Promise<{count: number, remaining: number}>}
 */
async function tokenBucket(key, limit = 100, windowSeconds = 60) {
  const client = redis.getClient();
  if (!client) return { count: 0, remaining: limit };
  const bucketKey = `tb:${key}`;
  try {
    const count = await client.incr(bucketKey);
    if (count === 1) await client.expire(bucketKey, windowSeconds);
    const remaining = Math.max(0, limit - count);
    return { count, remaining };
  } catch (err) {
    return { count: 0, remaining: limit };
  }
}

module.exports = { tokenBucket };
