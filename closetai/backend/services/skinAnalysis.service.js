/**
 * Perfect Corp YCE Skin Analysis API Service
 * 
 * API Documentation: https://yce.perfectcorp.com/document/index.html
 * 
 * Flow:
 * 1. File API - Get presigned URL for uploading image
 * 2. Task API - Create skin analysis task with file_id
 * 3. Status API - Poll for task completion
 * 4. Parse Results - Extract scores and visual overlays
 * 5. Storage - Save overlays to S3
 * 
 * Advanced Analysis Actions:
 * - wrinkle, pore, texture, acne, oiliness, radiance, moisture, redness
 * - face_tone, skin_type (basic)
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { yceClient, YCE_BASE_URL } = require('../lib/perfectCorpClient');
const logger = require('../utils/logger');
const env = require('../config/env');
const db = require('../lib/db');

const YCE_FILE_API = `${env.perfectCorp?.yceUrl || YCE_BASE_URL}/file/skin-analysis`;
const YCE_TASK_API = `${env.perfectCorp?.yceUrl || YCE_BASE_URL}/task/skin-analysis`;

// Advanced analysis actions supported by Perfect Corp API
const ADVANCED_ACTIONS = [
  'wrinkle',
  'pore',
  'texture',
  'acne',
  'oiliness',
  'radiance',
  'moisture',
  'redness'
];

// Basic analysis actions
const BASIC_ACTIONS = [
  'skin_type',
  'face_tone',
  'redness',
  'oiliness',
  'texture'
];

/**
 * Get presigned URL for file upload
 * @param {string} fileName - Original file name
 * @param {number} fileSize - File size in bytes
 * @param {string} contentType - MIME type (e.g., image/jpeg)
 * @returns {Promise<Object>} Upload URL and file_id
 */
async function initSkinAnalysisFileUpload(fileName, fileSize, contentType) {
  try {
    const response = await yceClient.post(YCE_FILE_API, {
      files: [{
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType
      }]
    });
    
    const fileData = response.data.data.files[0];
    return {
      fileId: fileData.file_id,
      uploadUrl: fileData.requests[0].url,
      uploadHeaders: fileData.requests[0].headers,
      pollingInterval: response.data.data.polling_interval || 2000
    };
  } catch (error) {
    logger.error('YCE File API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Upload image to presigned URL
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} uploadUrl - Presigned URL
 * @param {Object} uploadHeaders - Required headers
 */
async function uploadToPresignedUrl(fileBuffer, uploadUrl, uploadHeaders) {
  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      ...uploadHeaders,
      'Content-Length': fileBuffer.length
    }
  });
}

/**
 * Create skin analysis task with advanced actions
 * @param {string} fileId - File ID from upload
 * @param {string[]} actions - Analysis actions
 * @returns {Promise<Object>} Task ID and status
 */
async function createSkinAnalysisTask(fileId, actions = ADVANCED_ACTIONS) {
  try {
    const response = await yceClient.post(YCE_TASK_API, {
      src_file_id: fileId,
      dst_actions: actions,
      format: 'json'
    });
    
    return {
      taskId: response.data.data.task_id,
      status: response.data.data.task_status,
      pollingInterval: response.data.data.polling_interval || 2000
    };
  } catch (error) {
    logger.error('YCE Task API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Check skin analysis task status
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task status and results
 */
async function checkSkinAnalysisStatus(taskId) {
  try {
    const response = await yceClient.get(`${YCE_TASK_API}/status/${encodeURIComponent(taskId)}`);
    const data = response.data.data;
    
    return {
      taskId: data.task_id,
      status: data.task_status,
      results: data.results,
      pollingInterval: data.polling_interval,
      message: data.message
    };
  } catch (error) {
    logger.error('YCE Status API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse Perfect Corp advanced analysis results
 * @param {Object} results - Raw API results
 * @returns {Object} Parsed results with detailed scores
 */
function parseAdvancedResults(results) {
  const parsed = {
    // Basic skin info
    skinColorHex: null,
    undertone: null,
    skinType: null,
    skinAge: null,
    overallScore: null,
    
    // Detailed scores (0-1, higher is worse for concerns, except radiance)
    scores: {
      acne: null,
      pore: null,
      wrinkle: null,
      texture: null,
      oiliness: null,
      radiance: null,
      moisture: null,
      redness: null
    },
    
    // Visual overlays
    visuals: [],
    
    // Raw data
    rawData: results
  };
  
  // Parse face tone
  if (results.face_tone) {
    if (results.face_tone.hex) {
      parsed.skinColorHex = results.face_tone.hex;
    }
    if (results.face_tone.tone) {
      const tone = results.face_tone.tone.toLowerCase();
      if (tone.includes('warm') || tone.includes('yellow') || tone.includes('olive')) {
        parsed.undertone = 'warm';
      } else if (tone.includes('cool') || tone.includes('pink') || tone.includes('rose')) {
        parsed.undertone = 'cool';
      } else {
        parsed.undertone = 'neutral';
      }
    }
  }
  
  // Parse skin type
  if (results.skin_type) {
    if (results.skin_type.type) {
      parsed.skinType = results.skin_type.type;
    }
    if (results.skin_type.age) {
      parsed.skinAge = results.skin_type.age;
    }
  }
  
  // Parse detailed scores
  const scoreMappings = {
    acne: ['acne', 'acne_severity'],
    pore: ['pore', 'pore_size'],
    wrinkle: ['wrinkle', 'wrinkle_severity'],
    texture: ['texture', 'texture_score'],
    oiliness: ['oiliness', 'oil'],
    radiance: ['radiance', 'glow'],
    moisture: ['moisture', 'hydration'],
    redness: ['redness', 'sensitivity']
  };
  
  for (const [key, possibleKeys] of Object.entries(scoreMappings)) {
    for (const pk of possibleKeys) {
      if (results[pk] !== undefined) {
        parsed.scores[key] = parseFloat(results[pk]) || 0;
        break;
      }
    }
  }
  
  // Calculate overall score
  const concernScores = [
    parsed.scores.acne,
    parsed.scores.pore,
    parsed.scores.wrinkle,
    parsed.scores.texture,
    parsed.scores.oiliness,
    parsed.scores.redness
  ].filter(s => s !== null);
  
  if (concernScores.length > 0) {
    // Average of concerns (lower is better health)
    const avgConcern = concernScores.reduce((a, b) => a + b, 0) / concernScores.length;
    // Radiance and moisture are positive, so invert for overall
    const positiveFactors = [parsed.scores.radiance, parsed.scores.moisture].filter(s => s !== null);
    const avgPositive = positiveFactors.length > 0 
      ? positiveFactors.reduce((a, b) => a + b, 0) / positiveFactors.length 
      : 0.5;
    
    parsed.overallScore = Math.max(0, Math.min(100, Math.round((1 - avgConcern) * 50 + avgPositive * 50)));
  }
  
  // Parse visual overlays
  if (results.visuals) {
    parsed.visuals = results.visuals.map(v => ({
      type: v.type || v.overlay_type,
      url: v.url,
      concernLevel: v.level || v.severity || 'medium'
    }));
  }
  
  return parsed;
}

/**
 * Legacy parser for basic results
 * @param {Object} results - Raw API results
 * @returns {Object} Parsed results
 */
function parseAnalysisResults(results) {
  // Use the new advanced parser
  const advanced = parseAdvancedResults(results);
  
  return {
    skinColorHex: advanced.skinColorHex,
    undertone: advanced.undertone,
    skinType: advanced.skinType,
    analysisData: advanced.rawData
  };
}

/**
 * Poll task until completion
 * @param {string} taskId - Task ID
 * @param {number} maxAttempts - Maximum poll attempts
 * @param {number} intervalMs - Interval between polls
 * @returns {Promise<Object>} Final results
 */
async function pollTaskCompletion(taskId, maxAttempts = 60, intervalMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await checkSkinAnalysisStatus(taskId);
    
    if (status.status === 'success' || status.status === 'completed') {
      return parseAdvancedResults(status.results);
    }
    
    if (status.status === 'error' || status.status === 'failed') {
      throw new Error(status.message || 'Skin analysis failed');
    }
    
    // Use recommended polling interval if available
    const pollInterval = status.pollingInterval || intervalMs;
    logger.info(`Polling skin analysis: attempt ${attempt}/${maxAttempts}, status: ${status.status}`);
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Skin analysis timed out');
}

/**
 * Download and store visual overlays to S3
 * @param {Object} parsedResults - Parsed analysis results with visuals
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object>} Saved visual URLs
 */
async function storeVisualOverlays(parsedResults, tenantId, userId, analysisId) {
  const savedVisuals = {};
  
  for (const visual of parsedResults.visuals || []) {
    try {
      // Download image from Perfect Corp
      const imageResponse = await axios.get(visual.url, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(imageResponse.data);
      const overlayType = visual.type || 'unknown';
      
      // Store in S3
      const s3Key = `skin/${tenantId || 'public'}/${userId || 'anonymous'}/${analysisId}/${overlayType}.png`;
      
      // Check if storage has uploadBuffer method
      if (storage && storage.uploadBuffer) {
        await storage.uploadBuffer(buffer, s3Key, 'image/png');
        
        // Get signed URL
        const signedUrl = await storage.getSignedUrl(s3Key, 3600 * 24 * 7); // 7 days
        savedVisuals[overlayType] = signedUrl;
      } else {
        // Fallback: use original URL
        savedVisuals[overlayType] = visual.url;
      }
      
      // Save to database
      try {
        await db.query(
          `INSERT INTO skin_analysis_visuals 
            (skin_analysis_id, overlay_type, s3_key, s3_url, concern_level)
           VALUES ($1, $2, $3, $4, $5)`,
          [analysisId, overlayType, s3Key, savedVisuals[overlayType], visual.concernLevel]
        );
      } catch (dbError) {
        logger.warn('Failed to save visual to DB:', dbError.message);
      }
      
    } catch (error) {
      logger.error(`Failed to store visual overlay ${visual.type}:`, error.message);
    }
  }
  
  return savedVisuals;
}

/**
 * Save complete skin analysis results to database
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {Object} parsedResults - Parsed analysis results
 * @param {Object} visualUrls - Stored visual URLs
 * @returns {Promise<string>} Analysis ID
 */
async function saveAnalysisResults(userId, taskId, parsedResults, visualUrls = {}) {
  const analysisId = uuidv4();
  
  await db.query(
    `INSERT INTO skin_analysis 
      (id, user_id, perfect_corp_task_id, status, skin_color_hex, undertone, skin_type,
       acne_score, pore_score, wrinkle_score, texture_score, oiliness_score, 
       radiance_score, moisture_score, redness_score, overall_score, skin_age,
       visual_overlays, analysis_data, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
    [
      analysisId,
      userId,
      taskId,
      'completed',
      parsedResults.skinColorHex,
      parsedResults.undertone,
      parsedResults.skinType,
      parsedResults.scores.acne,
      parsedResults.scores.pore,
      parsedResults.scores.wrinkle,
      parsedResults.scores.texture,
      parsedResults.scores.oiliness,
      parsedResults.scores.radiance,
      parsedResults.scores.moisture,
      parsedResults.scores.redness,
      parsedResults.overallScore,
      parsedResults.skinAge,
      JSON.stringify(visualUrls),
      JSON.stringify(parsedResults.rawData)
    ]
  );
  
  return analysisId;
}

/**
 * Get analysis by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object>} Analysis record
 */
async function getAnalysisById(analysisId) {
  const result = await db.query(
    `SELECT * FROM skin_analysis WHERE id = $1`,
    [analysisId]
  );
  return result.rows[0] || null;
}

/**
 * Get visuals for an analysis
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Array>} Visual overlays
 */
async function getAnalysisVisuals(analysisId) {
  const result = await db.query(
    `SELECT * FROM skin_analysis_visuals WHERE skin_analysis_id = $1 ORDER BY overlay_type`,
    [analysisId]
  );
  return result.rows;
}

module.exports = {
  initSkinAnalysisFileUpload,
  uploadToPresignedUrl,
  createSkinAnalysisTask,
  checkSkinAnalysisStatus,
  parseAnalysisResults,
  parseAdvancedResults,
  pollTaskCompletion,
  storeVisualOverlays,
  saveAnalysisResults,
  getAnalysisById,
  getAnalysisVisuals,
  ADVANCED_ACTIONS,
  BASIC_ACTIONS
};

