/**
 * Kilo Gateway HTTP client (OpenAI-compatible API).
 * Supports streaming, retries, and credit-tracking for the sponsor Kilo integration.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const KILO_BASE = env.kilo?.gatewayBase || process.env.KILO_GATEWAY_BASE || 'https://api.kilo.ai/api/gateway';
const KILO_KEY = env.kilo?.apiKey || process.env.KILO_API_KEY;
const KILO_TIMEOUT = env.kilo?.timeoutMs || Number(process.env.KILO_TIMEOUT_MS) || 30_000;

if (!KILO_KEY) {
  logger.warn('KILO_API_KEY not set. Gateway calls will fail without it.');
}

const axiosInstance = axios.create({
  baseURL: KILO_BASE,
  timeout: KILO_TIMEOUT,
  headers: {
    Authorization: KILO_KEY ? `Bearer ${KILO_KEY}` : undefined,
    'Content-Type': 'application/json',
  },
});

// Redis for persisting last-seen credit count (optional)
let redisClient = null;
function getRedis() {
  if (!redisClient && env.redis?.url) {
    try {
      const Redis = require('ioredis');
      redisClient = new Redis(env.redis.url);
    } catch (e) {
      logger.warn('Redis not available for Kilo credit tracking:', e.message);
    }
  }
  if (!redisClient && (env.redis?.host || env.redis?.port)) {
    try {
      const Redis = require('ioredis');
      redisClient = new Redis({
        host: env.redis.host || 'localhost',
        port: env.redis.port || 6379,
      });
    } catch (e) {
      logger.warn('Redis not available for Kilo credit tracking:', e.message);
    }
  }
  return redisClient;
}

async function safePost(path, body = {}, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 3;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    try {
      const resp = await axiosInstance.post(path, body, {
        responseType: opts.responseType || 'json',
      });
      // Store credit header if present
      const credits =
        resp.headers['x-credit-count'] ||
        resp.headers['x-credit-remaining'] ||
        resp.headers['x-credit'];
      if (credits) {
        const redis = getRedis();
        if (redis) {
          await redis.set('kilo:last_credits', credits).catch(() => {});
        } else {
          global.__kilo_last_credits = credits;
        }
      }
      return resp;
    } catch (err) {
      lastErr = err;
      attempt++;
      const status = err?.response?.status;
      // Don't retry 4xx except 429
      if (status && status >= 400 && status < 500 && status !== 429) break;
      const delay = Math.min(
        10_000,
        Math.pow(2, attempt) * 200 + Math.floor(Math.random() * 200)
      );
      logger.debug(
        `Kilo post failed attempt=${attempt} status=${status} retrying in ${delay}ms err=${err?.message}`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Chat / generate wrapper (OpenAI-compatible)
 * @param {object} opts
 * @param {string} opts.model - Model name (e.g. 'gpt-5-chat-latest' or Kilo default)
 * @param {Array<{role:string,content:string}>} opts.messages - Chat messages
 * @param {object} opts.options - { stream, max_tokens, temperature, ... }
 */
async function createChatCompletion({
  model = 'kilo-default',
  messages = [],
  options = {},
} = {}) {
  const body = { model, messages, ...options };
  const resp = await safePost('/v1/chat/completions', body, { maxAttempts: 3 });
  return resp.data;
}

/**
 * Streaming chat completion — returns Axios response stream for piping to client
 */
function streamChatCompletion({
  model = 'kilo-default',
  messages = [],
  options = {},
} = {}) {
  const body = { model, messages, ...options };
  return axiosInstance.post('/v1/chat/completions', body, {
    responseType: 'stream',
    headers: { Authorization: `Bearer ${KILO_KEY}` },
    timeout: options.timeout || 60_000,
  });
}

/**
 * Get last seen credits (Redis or in-memory)
 */
async function getLastCredits() {
  const redis = getRedis();
  if (redis) {
    const v = await redis.get('kilo:last_credits').catch(() => null);
    return v;
  }
  return global.__kilo_last_credits || null;
}

module.exports = {
  createChatCompletion,
  streamChatCompletion,
  getLastCredits,
};
