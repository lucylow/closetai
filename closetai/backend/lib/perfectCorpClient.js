/**
 * Centralized Perfect Corp API client with retries and rate-limit awareness.
 * Use for VTON, generate, measure endpoints to handle transient 5xx/network errors.
 * Captures X-Credit-Count header for admin/judge visibility.
 * 
 * Skin Analysis API (YCE): https://yce.perfectcorp.com/document/index.html
 * Uses separate base URL: https://yce-api-01.makeupar.com/s2s/v2.0
 */
const axios = require('axios');
const { backOff } = require('exponential-backoff');
const env = require('../config/env');
const redis = require('../utils/redis');

const CREDIT_KEY = 'closetai:perfectcorp:last_credit';

const PERFECT_API_KEY = env.perfectCorp?.apiKey || process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY;

// Main Perfect Corp API client for VTON, generate, measure
const client = axios.create({
  baseURL: env.perfectCorp?.baseUrl || process.env.PERFECT_CORP_BASE_URL || 'https://yce-api-01.makeupar.com',
  timeout: 60_000,
  headers: {
    Authorization: `Bearer ${PERFECT_API_KEY}`,
  },
});

// YCE Skin Analysis API client (separate endpoint)
const YCE_BASE_URL = env.perfectCorp?.yceUrl || process.env.PERFECT_CORP_YCE_URL || 'https://yce-api-01.makeupar.com/s2s/v2.0';
const yceClient = axios.create({
  baseURL: YCE_BASE_URL,
  timeout: 60_000,
  headers: {
    Authorization: `Bearer ${PERFECT_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Capture X-Credit-Count from responses for admin status endpoint
client.interceptors.response.use(
  (response) => {
    const creditCount = response.headers['x-credit-count'];
    if (creditCount != null) redis.set(CREDIT_KEY, String(creditCount)).catch(() => {});
    return response;
  },
  (error) => {
    if (error.response?.headers?.['x-credit-count'] != null) {
      redis.set(CREDIT_KEY, String(error.response.headers['x-credit-count'])).catch(() => {});
    }
    return Promise.reject(error);
  }
);

const RETRY_OPTIONS = {
  startingDelay: 500,
  timeMultiple: 2,
  numOfAttempts: 4,
  retry: (e) => {
    const status = e?.response?.status;
    const isRetryable = !status || status >= 500 || status === 429;
    return isRetryable;
  },
};

/**
 * POST form-data with exponential backoff retries on 5xx/429/network errors.
 * @param {string} path - API path (e.g. /vton)
 * @param {FormData} form - FormData instance
 * @param {object} axiosOptions - { responseType, ... }
 * @returns {Promise<AxiosResponse>}
 */
async function postFormWithRetry(path, form, axiosOptions = {}) {
  return backOff(
    () =>
      client.post(path, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: client.defaults.headers.Authorization,
        },
        responseType: axiosOptions.responseType || undefined,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        ...axiosOptions,
      }),
    RETRY_OPTIONS
  );
}

/**
 * POST JSON with retries for generate endpoint.
 */
async function postJsonWithRetry(path, body, axiosOptions = {}) {
  return backOff(
    () =>
      client.post(path, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: client.defaults.headers.Authorization,
        },
        responseType: axiosOptions.responseType || undefined,
        ...axiosOptions,
      }),
    RETRY_OPTIONS
  );
}

module.exports = { client, postFormWithRetry, postJsonWithRetry, yceClient, YCE_BASE_URL };
