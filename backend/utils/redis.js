const env = require('../config/env');

let redisPublisher = null;

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

module.exports = { getRedis: () => ({ redisPublisher: getPublisher() }), publish, subscribe };
