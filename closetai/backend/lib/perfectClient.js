// backend/lib/perfectClient.js
// Robust Perfect / YouCam API wrapper with retry/backoff and Redis credit caching.
const axios = require("axios");
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);
const PERFECT_BASE = process.env.PERFECT_BASE || 'https://yce-api-01.makeupar.com';
const PERFECT_API_KEY = process.env.YOUCAM_API_KEY || process.env.PERFECT_API_KEY || process.env.PERFECT_CORP_API_KEY;
const PERFECT_TIMEOUT_MS = Number(process.env.PERFECT_TIMEOUT_MS || 90000);
if (!PERFECT_BASE || !PERFECT_API_KEY) {
  console.warn("Warning: PERFECT_BASE or PERFECT_API_KEY not set.");
}
const client = axios.create({
  baseURL: PERFECT_BASE,
  timeout: PERFECT_TIMEOUT_MS,
  headers: { Authorization: `Bearer ${PERFECT_API_KEY}`, "Content-Type": "application/json" }
});
async function safePost(path, body, tenantId, opts) {
  const maxAttempts = 4;
  let attempt = 0;
  let lastErr = null;
  const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  while (attempt < maxAttempts) {
    try {
      const resp = await client.post(path, body, { responseType: opts?.responseType || "json", headers: { "X-Request-Id": requestId } });
      const creditsHeader = resp.headers["x-credit-remaining"] || resp.headers["x-credits-remaining"];
      if (tenantId && creditsHeader !== undefined) {
        await redis.set(`tenant:${tenantId}:perfect_credits`, creditsHeader, "EX", 60 * 30);
      }
      return { data: resp.data, headers: resp.headers };
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      const retryAfter = parseInt(err?.response?.headers?.["retry-after"] || "0", 10);
      const backoffMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(500 * Math.pow(2, attempt), 20000);
      await new Promise(r => setTimeout(r, backoffMs));
      attempt++;
    }
  }
  throw lastErr;
}
async function registerFile(filesPayload, tenantId) { return safePost("/s2s/v2.0/file", { files: filesPayload }, tenantId); }
async function text2img(payload, tenantId) { return safePost("/ai-api/v1/text2img", payload, tenantId); }
async function imageEdit(payload, tenantId) { return safePost("/ai-api/v1/image-edit", payload, tenantId); }
async function beautify(payload, tenantId) { return safePost("/ai-api/v1/beautify", payload, tenantId); }
async function tryOn(payload, tenantId) { return safePost("/ai-api/v1/fashion/tryon", payload, tenantId); }
async function skinAnalysis(payload, tenantId) { return safePost("/s2s/v2.0/task/skin-analysis", payload, tenantId); }
async function getTaskStatus(taskId) { const resp = await client.get(`/s2s/v2.0/task/${taskId}`); return { data: resp.data, headers: resp.headers }; }
async function getTenantCredits(tenantId) { return redis.get(`tenant:${tenantId}:perfect_credits`); }
module.exports = { safePost, registerFile, text2img, imageEdit, beautify, tryOn, skinAnalysis, getTaskStatus, getTenantCredits };
