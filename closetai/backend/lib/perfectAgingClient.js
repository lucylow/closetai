/**
 * Perfect Corp Aging API Client - Skin Analysis & Aging Simulation
 * Specialized client for AI aging features using Perfect/YouCam APIs
 * Handles skin analysis, aging simulation, and diagnostic overlays
 */

const axios = require('axios');
const Redis = require('ioredis');
const debug = require('debug')('closet:perfect-aging');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL, { 
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100
});

// Perfect Corp YCE API base URL for skin analysis
const YCE_BASE = process.env.PERFECT_BASE || 'https://yce-api-01.makeupar.com';
const API_KEY = process.env.YOUCAM_API_KEY || process.env.PERFECT_API_KEY || process.env.PERFECT_CORP_API_KEY;
const TIMEOUT = Number(process.env.PERFECT_TIMEOUT_MS) || 90000;

// Create axios instance for YCE API
const yceClient = axios.create({
  baseURL: YCE_BASE,
  headers: { 
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: TIMEOUT
});

/**
 * Update tenant credit tracking in Redis
 * @param {string} tenantId - Tenant UUID
 * @param {number} credits - Remaining credits
 */
async function updateTenantCredits(tenantId, credits) {
  if (tenantId && credits !== undefined) {
    await redis.set(`tenant:${tenantId}:perfect_credits`, credits, 'EX', 60 * 60);
    debug(`Updated credits for tenant ${tenantId}: ${credits}`);
  }
}

/**
 * Get tenant credits from Redis
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<number>} Remaining credits
 */
async function getTenantCredits(tenantId) {
  if (!tenantId) return null;
  const credits = await redis.get(`tenant:${tenantId}:perfect_credits`);
  return credits ? parseInt(credits) : null;
}

/**
 * Safe API call with retry logic and credit tracking
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint
 * @param {Object} data - Request body
 * @param {string} tenantId - Tenant UUID for credit tracking
 * @param {Object} opts - Additional options
 */
async function safeCall(method, path, data, tenantId, opts = {}) {
  const maxAttempts = opts.maxAttempts || 3;
  const retryStatuses = opts.retryStatuses || [429, 500, 502, 503, 504];
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const config = {
        method,
        url: path,
        ...(data && { data })
      };
      
      const resp = await yceClient(config);
      
      // Track credits if provided
      const credits = resp.headers['x-credit-remaining'];
      if (credits !== undefined) {
        await updateTenantCredits(tenantId, parseInt(credits));
      }
      
      return resp.data;
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = retryStatuses.includes(status);
      
      if (!isRetryable || attempt === maxAttempts) {
        debug(`API call failed after ${attempt} attempts:`, err.message);
        throw err;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      debug(`Retrying after ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * Register files with Perfect API to get upload URLs
 * @param {Array<{filename: string, contentType: string}>} files - Files to register
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Array<{fileId: string, uploadUrl: string}>>}
 */
async function registerFiles(files, tenantId) {
  const response = await safeCall('post', '/s2s/v2.0/file', {
    files: files.map(f => ({
      name: f.filename,
      type: f.contentType
    }))
  }, tenantId);
  
  return response.files || [];
}

/**
 * Start skin analysis task
 * @param {Object} params - Analysis parameters
 * @param {string} params.srcFileId - Source file ID from registerFiles
 * @param {Array<string>} params.actions - Analysis actions (wrinkle, pore, pigment, moisture, uv_damage, elasticity)
 * @param {string} params.tenantId - Tenant UUID
 * @returns {Promise<{taskId: string, status: string}>}
 */
async function skinAnalysisStart({ srcFileId, actions = ['wrinkle', 'pore', 'pigment', 'moisture'], tenantId }) {
  const response = await safeCall('post', '/s2s/v2.0/task/skin-analysis', {
    src_file_id: srcFileId,
    dst_actions: actions,
    options: {
      output_format: 'json',
      overlay: true,
      overlay_format: 'png'
    }
  }, tenantId);
  
  return {
    taskId: response.task_id || response.taskId,
    status: response.status || 'processing'
  };
}

/**
 * Get task status from Perfect API
 * @param {string} taskId - Task UUID
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<{status: string, result?: Object}>}
 */
async function getTaskStatus(taskId, tenantId) {
  const response = await safeCall('get', `/s2s/v2.0/task/${taskId}/status`, null, tenantId);
  
  return {
    status: response.status,
    result: response.result,
    progress: response.progress
  };
}

/**
 * Start aging simulation task (text2img based)
 * @param {Object} params - Simulation parameters
 * @param {string} params.srcFileId - Source file ID
 * @param {number} params.yearsDelta - Years to simulate (+ for older, - for younger)
 * @param {string} params.direction - 'older' or 'younger'
 * @param {number} params.strength - Simulation strength (0-1)
 * @param {string} params.tenantId - Tenant UUID
 * @returns {Promise<{taskId: string, status: string}>}
 */
async function agingSimulationStart({ srcFileId, yearsDelta, direction, strength = 0.8, tenantId }) {
  // Build prompt for aging simulation
  const agePrompt = direction === 'older' 
    ? `aged ${Math.abs(yearsDelta)} years older, visible wrinkles, aged skin texture`
    : `aged ${Math.abs(yearsDelta)} years younger, youthful skin, smooth texture`;
  
  const response = await safeCall('post', '/s2s/v2.0/task/text2img', {
    prompt: `portrait photo, face, ${agePrompt}, high quality, detailed`,
    negative_prompt: 'blurry, low quality, deformed, distorted',
    width: 1024,
    height: 1024,
    steps: 30,
    guidance_scale: 7.5,
    seed: Math.floor(Math.random() * 1000000),
    init_image: srcFileId,
    strength: strength
  }, tenantId);
  
  return {
    taskId: response.task_id || response.taskId,
    status: response.status || 'processing'
  };
}

/**
 * Start image edit task for aging simulation
 * @param {Object} params - Edit parameters
 * @param {string} params.srcFileId - Source file ID
 * @param {string} params.editType - Type of edit (smooth, wrinkle_reduce, age_progression)
 * @param {string} params.tenantId - Tenant UUID
 * @returns {Promise<{taskId: string, status: string}>}
 */
async function imageEditStart({ srcFileId, editType, tenantId }) {
  const editPrompts = {
    smooth: 'skin smoothing, even texture, refined pores',
    wrinkle_reduce: 'reduced wrinkles, smoother skin, youthful appearance',
    age_progression: 'aged appearance, visible wrinkles, older features'
  };
  
  const response = await safeCall('post', '/s2s/v2.0/task/image-edit', {
    prompt: editPrompts[editType] || editType,
    negative_prompt: 'blurry, low quality, distorted face',
    init_image: srcFileId,
    strength: 0.7,
    guidance_scale: 7.5
  }, tenantId);
  
  return {
    taskId: response.task_id || response.taskId,
    status: response.status || 'processing'
  };
}

/**
 * Get face landmarks for precise overlay positioning
 * @param {string} srcFileId - Source file ID
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<{landmarks: Array, faceBox: Object}>}
 */
async function getFaceLandmarks(srcFileId, tenantId) {
  const response = await safeCall('post', '/s2s/v2.0/task/face-landmarks', {
    src_file_id: srcFileId
  }, tenantId);
  
  return {
    landmarks: response.landmarks || [],
    faceBox: response.face_box || response.faceBox
  };
}

/**
 * Poll task until completion
 * @param {string} taskId - Task UUID
 * @param {string} tenantId - Tenant UUID
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} intervalMs - Polling interval
 * @returns {Promise<Object>} Task result
 */
async function pollTask(taskId, tenantId, maxAttempts = 60, intervalMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { status, result, progress } = await getTaskStatus(taskId, tenantId);
    
    if (status === 'completed' || status === 'success') {
      return result;
    }
    
    if (status === 'failed' || status === 'error') {
      throw new Error(`Task ${taskId} failed: ${result?.error || 'Unknown error'}`);
    }
    
    debug(`Task ${taskId} progress: ${progress || status}`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  throw new Error(`Task ${taskId} timed out after ${maxAttempts} attempts`);
}

module.exports = {
  registerFiles,
  skinAnalysisStart,
  getTaskStatus,
  agingSimulationStart,
  imageEditStart,
  getFaceLandmarks,
  pollTask,
  safeCall,
  getTenantCredits,
  updateTenantCredits
};
