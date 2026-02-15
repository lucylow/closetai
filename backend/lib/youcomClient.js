/**
 * You.com API Client — robust HTTP client with retries & rate-limit handling.
 * All API keys stay server-side. Use for search, news, and content endpoints.
 */
const axios = require('axios');
const env = require('../config/env');

const BASE = env.youcom?.baseUrl || process.env.YOUCOM_BASE_URL || 'https://api.ydc-index.io/v1';
const API_KEY = env.youcom?.apiKey || process.env.YOUCOM_API_KEY;

const client = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  headers: {
    'X-API-Key': API_KEY || '',
    'Content-Type': 'application/json',
  },
});

/**
 * Safe GET with exponential backoff retry. Does not retry 4xx client errors.
 * @param {string} path - API path (e.g. /search)
 * @param {Object} params - Query params (query, count, freshness, etc.)
 * @param {Object} opts - { maxAttempts }
 * @returns {Promise<{ data, rateInfo }>}
 */
async function safeGet(path, params = {}, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 4;
  let attempt = 0;
  let lastErr = null;

  if (!API_KEY) {
    const err = new Error('YOUCOM_API_KEY required in env');
    err.code = 'NO_API_KEY';
    throw err;
  }

  while (attempt < maxAttempts) {
    try {
      const resp = await client.get(path, { params });
      resp.rateInfo = {
        limit: resp.headers['x-rate-limit-limit'],
        remaining: resp.headers['x-rate-limit-remaining'],
        reset: resp.headers['x-rate-limit-reset'],
      };
      return resp;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const status = err?.response?.status;
      // Don't retry client errors (4xx)
      if (status && status >= 400 && status < 500) break;
      const delay = Math.pow(2, attempt) * 300 + Math.random() * 200;
      if (process.env.DEBUG?.includes('closet:youcom')) {
        console.warn(`You.com GET failed (attempt ${attempt}) — retrying in ${Math.round(delay)}ms`, err?.message);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Search You.com web/news. Uses official params: query, count, freshness.
 */
async function search(query, options = {}) {
  const params = {
    query,
    count: options.count ?? options.num_results ?? 10,
    ...(options.freshness && { freshness: options.freshness }),
    ...(options.offset != null && { offset: options.offset }),
  };
  const resp = await safeGet('/search', params);
  return { data: resp.data, rateInfo: resp.rateInfo };
}

module.exports = { client, safeGet, search };
