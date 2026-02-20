/**
 * YCE (YouCam Enterprise) API Client
 * 
 * Perfect/YouCam AI API integration for:
 * - Makeup try-on
 * - Skin analysis
 * - Hair styling
 * - Clothing virtual try-on
 * - Accessory try-on
 * 
 * Features:
 * - File registration API (must upload before creating AI tasks)
 * - Rate limiting with exponential backoff (250 requests per 300s, 5 QPS)
 * - Automatic file purging after 24 hours (we cache/store locally)
 * - Credit tracking
 * 
 * API Base: https://yce-api-01.makeupar.com/s2s/v2.0
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const YCE_BASE_URL = env.perfectCorp?.yceUrl || process.env.PERFECT_CORP_YCE_URL || 'https://yce-api-01.makeupar.com/s2s/v2.0';
const YCE_API_KEY = env.perfectCorp?.apiKey || process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY;

// Rate limiting configuration (250 requests per 300s, 5 QPS)
const RATE_LIMIT = {
  maxRequests: 250,
  windowMs: 300_000, // 300 seconds
  minInterval: 200, // 5 QPS = 200ms minimum between requests
};

// In-memory rate limiter (use Redis for distributed systems)
let requestTimestamps = [];
let lastRequestTime = 0;

/**
 * Check if we're within rate limits
 */
function checkRateLimit() {
  const now = Date.now();
  
  // Clean old timestamps
  requestTimestamps = requestTimestamps.filter(ts => now - ts < RATE_LIMIT.windowMs);
  
  // Check if we've hit the limit
  if (requestTimestamps.length >= RATE_LIMIT.maxRequests) {
    const oldestInWindow = requestTimestamps[0];
    const waitTime = RATE_LIMIT.windowMs - (now - oldestInWindow);
    return { allowed: false, waitTime };
  }
  
  // Check minimum interval between requests (5 QPS)
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT.minInterval) {
    return { allowed: false, waitTime: RATE_LIMIT.minInterval - timeSinceLastRequest };
  }
  
  return { allowed: true, waitTime: 0 };
}

/**
 * Acquire rate limit token (blocks until available)
 */
async function acquireRateLimitToken(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const { allowed, waitTime } = checkRateLimit();
    
    if (allowed) {
      const now = Date.now();
      requestTimestamps.push(now);
      lastRequestTime = now;
      return true;
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000)));
  }
  
  throw new Error('Rate limit timeout: could not acquire token after max retries');
}

/**
 * Sleep utility for backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry handler
 */
async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 4,
    baseDelay = 500,
    maxDelay = 10000,
    retryableStatuses = [429, 500, 502, 503, 504],
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Acquire rate limit token before each request
      await acquireRateLimitToken();
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      const status = error.response?.status;
      const isRetryable = !status || retryableStatuses.includes(status);
      
      if (!isRetryable || attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter
      const jitter = Math.random() * 100;
      const totalDelay = delay + jitter;
      
      console.log(`[YCE] Retry attempt ${attempt + 1}/${maxAttempts} after ${totalDelay}ms (status: ${status})`);
      await sleep(totalDelay);
    }
  }
  
  throw lastError;
}

// Create YCE axios client
const yceClient = axios.create({
  baseURL: YCE_BASE_URL,
  timeout: 60_000,
  headers: {
    'Authorization': `Bearer ${YCE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Track credit usage
let lastCreditCount = 0;

yceClient.interceptors.response.use(
  (response) => {
    const creditCount = response.headers['x-credit-count'];
    if (creditCount != null) {
      lastCreditCount = parseInt(creditCount, 10);
    }
    return response;
  },
  (error) => {
    if (error.response?.headers?.['x-credit-count'] != null) {
      lastCreditCount = parseInt(error.response.headers['x-credit-count'], 10);
    }
    return Promise.reject(error);
  }
);

/**
 * Register files to get upload URLs
 * 
 * PerfectCorp requires registering files first before AI tasks
 * 
 * @param {Array<{filename: string, type: string}>} files - Array of files to register
 * @returns {Promise<{files: Array<{file_id: string, upload_url: string, public_url: string}>}
 */
async function registerFiles(files) {
  const payload = {
    files: files.map(f => ({
      file_name: f.filename,
      file_type: f.type,
    })),
  };
  
  return withRetry(() =>
    yceClient.post('/file/any', payload)
  );
}

/**
 * Upload file to presigned URL
 * 
 * @param {string} uploadUrl - The presigned URL from registerFiles
 * @param {Buffer|string} fileData - The file content
 * @param {string} contentType - MIME type
 */
async function uploadToPresignedUrl(uploadUrl, fileData, contentType) {
  await axios.put(uploadUrl, fileData, {
    headers: {
      'Content-Type': contentType,
    },
    timeout: 60_000,
  });
}

/**
 * Makeup Try-On Task
 * 
 * @param {string} srcFileUrl - Source image URL (must be registered)
 * @param {string} makeupType - Makeup type (lip, eye, cheek, makeup)
 * @param {Array} effects - Array of effect IDs
 * @returns {Promise<object>}
 */
async function makeupTryOnTask(srcFileUrl, makeupType = 'lip', effects = []) {
  const payload = {
    src_file_url: srcFileUrl,
    makeup_type: makeupType,
    effects: effects,
  };
  
  return withRetry(() =>
    yceClient.post('/task/makeup-vto', payload)
  );
}

/**
 * Skin Analysis Task
 * 
 * @param {string} srcFileUrl - Source image URL
 * @param {string} analysisType - Type of analysis (basic, advanced, full)
 * @param {Array} concerns - Specific concerns to analyze
 * @returns {Promise<object>}
 */
async function skinAnalysisTask(srcFileUrl, analysisType = 'full', concerns = []) {
  const payload = {
    src_file_url: srcFileUrl,
    analysis_type: analysisType,
    concerns: concerns,
  };
  
  return withRetry(() =>
    yceClient.post('/task/skin-analysis', payload)
  );
}

/**
 * Hair Style Task
 * 
 * @param {string} srcFileUrl - Source image URL
 * @param {string} styleId - Hair style ID
 * @param {string} color - Hair color (optional)
 * @returns {Promise<object>}
 */
async function hairStyleTask(srcFileUrl, styleId, color = null) {
  const payload = {
    src_file_url: srcFileUrl,
    style_id: styleId,
    ...(color && { color }),
  };
  
  return withRetry(() =>
    yceClient.post('/task/hair-style', payload)
  );
}

/**
 * Clothing Virtual Try-On Task
 * 
 * @param {string} srcFileUrl - Source image (person) URL
 * @param {Array<string>} refGarmentUrls - Array of garment image URLs
 * @param {string} category - Clothing category (top, bottom, dress, etc.)
 * @returns {Promise<object>}
 */
async function clothesTryOnTask(srcFileUrl, refGarmentUrls, category = 'top') {
  const payload = {
    src_file_url: srcFileUrl,
    ref_garment_urls: refGarmentUrls,
    category: category,
  };
  
  return withRetry(() =>
    yceClient.post('/task/cloth', payload)
  );
}

/**
 * Accessory Try-On Task
 * 
 * @param {string} srcFileUrl - Source image URL
 * @param {Array<string>} refAccessoryUrls - Array of accessory image URLs
 * @param {string} type - Accessory type (glasses, earrings, necklace, etc.)
 * @returns {Promise<object>}
 */
async function accessoryTryOnTask(srcFileUrl, refAccessoryUrls, type = 'glasses') {
  const payload = {
    src_file_url: srcFileUrl,
    ref_accessory_urls: refAccessoryUrls,
    type: type,
  };
  
  return withRetry(() =>
    yceClient.post('/task/2d-vto/accessory', payload)
  );
}

/**
 * Get job status/poll for result
 * 
 * @param {string} taskId - Task ID from create task response
 * @returns {Promise<object>}
 */
async function getTaskResult(taskId) {
  return withRetry(() =>
    yceClient.get(`/task/${taskId}`)
  );
}

/**
 * Poll for task completion
 * 
 * @param {string} taskId - Task ID
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} intervalMs - Interval between polls
 * @returns {Promise<object>}
 */
async function pollTaskCompletion(taskId, maxAttempts = 60, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskResult(taskId);
    
    // Check for completion status
    const status = result.data?.status || result.data?.task_status;
    
    if (status === 'completed' || status === 'success') {
      return result.data;
    }
    
    if (status === 'failed' || status === 'error') {
      throw new Error(result.data?.error_message || 'Task failed');
    }
    
    // Wait before next poll
    await sleep(intervalMs);
  }
  
  throw new Error(`Task polling timeout after ${maxAttempts} attempts`);
}

/**
 * Get current credit count from last response
 */
function getLastCreditCount() {
  return lastCreditCount;
}

/**
 * Get rate limit status
 */
function getRateLimitStatus() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(ts => now - ts < RATE_LIMIT.windowMs);
  
  return {
    requestsInWindow: requestTimestamps.length,
    maxRequests: RATE_LIMIT.maxRequests,
    windowMs: RATE_LIMIT.windowMs,
    timeUntilNextRequest: Math.max(0, RATE_LIMIT.minInterval - (now - lastRequestTime)),
  };
}

module.exports = {
  // Core client
  yceClient,
  
  // File registration
  registerFiles,
  uploadToPresignedUrl,
  
  // AI Tasks
  makeupTryOnTask,
  skinAnalysisTask,
  hairStyleTask,
  clothesTryOnTask,
  accessoryTryOnTask,
  
  // Task polling
  getTaskResult,
  pollTaskCompletion,
  
  // Utilities
  getLastCreditCount,
  getRateLimitStatus,
  withRetry,
  acquireRateLimitToken,
};
