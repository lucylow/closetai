const env = require('../config/env');

let redisPublisher = null;
let redisClient = null;

function getPublisher() {
  if (!redisPublisher) {
    try {
      const Redis = require('ioredis');
      redisPublisher = new Redis({
        host: env.redis?.host || 'localhost',
        port: env.redis?.port || 6379,
        retryStrategy: () => null,
        maxRetriesPerRequest: 1,
      });
    } catch (e) {
      return null;
    }
  }
  return redisPublisher;
}

function publish(channel, message) {
  const pub = getPublisher();
  if (pub) {
    pub.publish(channel, message).catch(() => {});
  }
}

function createSubscriber() {
  try {
    const Redis = require('ioredis');
    return new Redis({
      host: env.redis?.host || 'localhost',
      port: env.redis?.port || 6379,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
    });
  } catch (e) {
    return null;
  }
}

function subscribe(channel, callback) {
  const sub = createSubscriber();
  if (!sub) return null;
  sub.subscribe(channel, (err) => {
    if (err) return;
  });
  sub.on('message', (ch, msg) => {
    if (ch === channel) callback(msg);
  });
  return () => {
    sub.unsubscribe(channel);
    sub.quit();
  };
}

function getClient() {
  if (!redisClient) {
    try {
      const Redis = require('ioredis');
      redisClient = env.redis?.url
        ? new Redis(env.redis.url, { retryStrategy: () => null, maxRetriesPerRequest: 1 })
        : new Redis({
            host: env.redis?.host || 'localhost',
            port: env.redis?.port || 6379,
            retryStrategy: () => null,
            maxRetriesPerRequest: 1,
          });
    } catch (e) {
      return null;
    }
  }
  return redisClient;
}

async function get(key) {
  const client = getClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (e) {
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  const client = getClient();
  if (!client) return false;
  try {
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getRedis: () => ({ redisPublisher: getPublisher() }),
  publish,
  subscribe,
  getClient,
  get,
  set,
};
