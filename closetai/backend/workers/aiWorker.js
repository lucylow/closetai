/**
 * AI Worker - BullMQ worker for all Perfect/YouCam AI jobs
 * Processes: makeup_tryon, skin_analysis, hair_style, fashion_tryon, 
 *            accessory_tryon, creative_lookbook, fun_filter, avatar_creation
 * 
 * Run via: node workers/aiWorker.js
 * Or in k8s: kubectl apply -f deployment/kubernetes/ai-worker.yaml
 */
const { Worker } = require('bullmq');
const IORedis = require('ioredis');

// Local imports
const db = require('../lib/db');
const storage = require('../lib/storage');
const { getQueueCounts, getJobStatus } = require('../lib/queue');
const logger = require('../utils/logger');
const { getSignedUrlForKey } = require('../lib/storage');

// YCE Client for Perfect/YouCam APIs
const yceClient = require('../lib/yceClient');
const axios = require('axios');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = process.env.AI_QUEUE_NAME || 'ai-jobs';
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3', 10);

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Track metrics
const metrics = {
  processed: 0,
  failed: 0,
  totalDuration: 0,
  creditUsage: 0,
};

/**
 * Get signed GET URL for a storage key
 */
async function getSignedGetUrl(key, expiresIn = 3600) {
  return getSignedUrlForKey(key, expiresIn);
}

/**
 * Record API usage for billing/audit
 */
async function recordApiUsage(provider, endpoint, userId, jobId, creditsUsed, requestPayload) {
  try {
    await db.query(
      `INSERT INTO usage_events (user_id, event_type, credits, metadata, job_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, `${provider}:${endpoint}`, creditsUsed || 1, JSON.stringify(requestPayload || {}), jobId]
    );
  } catch (error) {
    logger.error('[aiWorker] Failed to record API usage', { error: error.message });
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, result = null, error = null, metadata = null) {
  const updates = {
    status,
    updated_at: new Date(),
  };
  
  if (result) {
    updates.result_key = result.key;
    updates.result_url = result.url;
    if (result.signedUrl) updates.signed_url = result.signedUrl;
  }
  
  if (error) {
    updates.error_message = error;
  }
  
  if (metadata) {
    updates.metadata = JSON.stringify(metadata);
  }
  
  if (status === 'completed') {
    updates.completed_at = new Date();
  }
  
  const fields = Object.keys(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = [jobId, ...Object.values(updates)];
  
  await db.query(
    `UPDATE gen_jobs SET ${setClause} WHERE id = $1`,
    values
  );
}

/**
 * Call Perfect Corp Makeup API with file registration and task polling
 */
async function callPerfectMakeupAPI(imageBuffer, makeupStyle, colors, intensity) {
  logger.info('[aiWorker] Calling Perfect Makeup API', { makeupStyle, colors, intensity });
  
  try {
    // Register the image file with YCE
    const filename = `makeup_${Date.now()}.jpg`;
    const registerResp = await yceClient.registerFiles([{ filename, type: 'image/jpeg' }]);
    const { file_id, upload_url, public_url } = registerResp.data.files[0];
    
    // Upload image to presigned URL
    await yceClient.uploadToPresignedUrl(upload_url, imageBuffer, 'image/jpeg');
    
    // Create makeup try-on task
    const taskResp = await yceClient.makeupTryOnTask(public_url, makeupStyle, colors || []);
    const taskId = taskResp.data.task_id;
    
    // Poll for completion
    const result = await yceClient.pollTaskCompletion(taskId, 60, 2000);
    
    // Download result
    const resultResp = await axios.get(result.result_url, { responseType: 'arraybuffer' });
    
    return {
      imageBuffer: Buffer.from(resultResp.data),
      metadata: { taskId, makeupStyle, colors, intensity }
    };
  } catch (error) {
    logger.error('[aiWorker] Makeup API error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Call Perfect Corp Skin Analysis API with file registration and task polling
 */
async function callPerfectSkinAPI(imageBuffer, analysisType) {
  logger.info('[aiWorker] Calling Perfect Skin API', { analysisType });
  
  try {
    // Register the image file with YCE
    const filename = `skin_${Date.now()}.jpg`;
    const registerResp = await yceClient.registerFiles([{ filename, type: 'image/jpeg' }]);
    const { file_id, upload_url, public_url } = registerResp.data.files[0];
    
    // Upload image to presigned URL
    await yceClient.uploadToPresignedUrl(upload_url, imageBuffer, 'image/jpeg');
    
    // Create skin analysis task
    const taskResp = await yceClient.skinAnalysisTask(public_url, analysisType);
    const taskId = taskResp.data.task_id;
    
    // Poll for completion
    const result = await yceClient.pollTaskCompletion(taskId, 60, 2000);
    
    // Download result image if available
    let imageBufferResult = null;
    if (result.result_url) {
      const resultResp = await axios.get(result.result_url, { responseType: 'arraybuffer' });
      imageBufferResult = Buffer.from(resultResp.data);
    }
    
    return {
      imageBuffer: imageBufferResult,
      metadata: {
        skinType: result.skin_type || 'unknown',
        hydration: result.hydration_score || 0,
        elasticity: result.elasticity_score || 0,
        concerns: result.concerns || [],
        recommendations: result.recommendations || [],
        analysis: result.analysis || {}
      }
    };
  } catch (error) {
    logger.error('[aiWorker] Skin API error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Call Perfect Corp Hair API with file registration and task polling
 */
async function callPerfectHairAPI(imageBuffer, hairStyle, hairColor, highlights) {
  logger.info('[aiWorker] Calling Perfect Hair API', { hairStyle, hairColor, highlights });
  
  try {
    // Register the image file with YCE
    const filename = `hair_${Date.now()}.jpg`;
    const registerResp = await yceClient.registerFiles([{ filename, type: 'image/jpeg' }]);
    const { file_id, upload_url, public_url } = registerResp.data.files[0];
    
    // Upload image to presigned URL
    await yceClient.uploadToPresignedUrl(upload_url, imageBuffer, 'image/jpeg');
    
    // Create hair style task
    const taskResp = await yceClient.hairStyleTask(public_url, hairStyle, hairColor);
    const taskId = taskResp.data.task_id;
    
    // Poll for completion
    const result = await yceClient.pollTaskCompletion(taskId, 60, 2000);
    
    // Download result
    const resultResp = await axios.get(result.result_url, { responseType: 'arraybuffer' });
    
    return Buffer.from(resultResp.data);
  } catch (error) {
    logger.error('[aiWorker] Hair API error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Call Perfect Corp VTON API with file registration and task polling
 */
async function callPerfectVTONAPI(personBuffer, garmentBuffer, category, fit) {
  logger.info('[aiWorker] Calling Perfect VTON API', { category, fit });
  
  try {
    // Register person image
    const personFilename = `person_${Date.now()}.jpg`;
    const personRegResp = await yceClient.registerFiles([{ filename: personFilename, type: 'image/jpeg' }]);
    const personFile = personRegResp.data.files[0];
    await yceClient.uploadToPresignedUrl(personFile.upload_url, personBuffer, 'image/jpeg');
    
    // Register garment image
    const garmentFilename = `garment_${Date.now()}.jpg`;
    const garmentRegResp = await yceClient.registerFiles([{ filename: garmentFilename, type: 'image/jpeg' }]);
    const garmentFile = garmentRegResp.data.files[0];
    await yceClient.uploadToPresignedUrl(garmentFile.upload_url, garmentBuffer, 'image/jpeg');
    
    // Create VTON task
    const taskResp = await yceClient.clothesTryOnTask(personFile.public_url, [garmentFile.public_url], category);
    const taskId = taskResp.data.task_id;
    
    // Poll for completion
    const result = await yceClient.pollTaskCompletion(taskId, 60, 2000);
    
    // Download result
    const resultResp = await axios.get(result.result_url, { responseType: 'arraybuffer' });
    
    return Buffer.from(resultResp.data);
  } catch (error) {
    logger.error('[aiWorker] VTON API error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Call Perfect Corp Accessory API with file registration and task polling
 */
async function callPerfectAccessoryAPI(imageBuffer, accessoryType, position) {
  logger.info('[aiWorker] Calling Perfect Accessory API', { accessoryType, position });
  
  try {
    // Register the image file with YCE
    const filename = `accessory_${Date.now()}.jpg`;
    const registerResp = await yceClient.registerFiles([{ filename, type: 'image/jpeg' }]);
    const { file_id, upload_url, public_url } = registerResp.data.files[0];
    
    // Upload image to presigned URL
    await yceClient.uploadToPresignedUrl(upload_url, imageBuffer, 'image/jpeg');
    
    // Create accessory try-on task
    const taskResp = await yceClient.accessoryTryOnTask(public_url, [], accessoryType);
    const taskId = taskResp.data.task_id;
    
    // Poll for completion
    const result = await yceClient.pollTaskCompletion(taskId, 60, 2000);
    
    // Download result
    const resultResp = await axios.get(result.result_url, { responseType: 'arraybuffer' });
    
    return Buffer.from(resultResp.data);
  } catch (error) {
    logger.error('[aiWorker] Accessory API error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Placeholder: Call Perfect Corp Creative/Lookbook API
 */
async function callPerfectCreativeAPI(prompt, style, images) {
  // TODO: Implement actual Perfect Corp Creative API call
  logger.info('[aiWorker] Calling Perfect Creative API', { prompt, style });
  return images[0]; // Return first image as placeholder
}

/**
 * Placeholder: Call Perfect Corp Fun Filter API
 */
async function callPerfectFilterAPI(imageBuffer, filterName, intensity) {
  // TODO: Implement actual Perfect Corp Fun Filter API call
  logger.info('[aiWorker] Calling Perfect Filter API', { filterName, intensity });
  return imageBuffer;
}

/**
 * Placeholder: Call Perfect Corp Avatar API
 */
async function callPerfectAvatarAPI(imageBuffer, avatarStyle) {
  // TODO: Implement actual Perfect Corp Avatar API call
  logger.info('[aiWorker] Calling Perfect Avatar API', { avatarStyle });
  return imageBuffer;
}

/**
 * Process makeup try-on job
 */
async function processMakeupTryon(job) {
  const { userId, imageKey, makeupStyle, colors, intensity = 0.8 } = job.data.payload;
  
  logger.info(`[aiWorker] Processing makeup_tryon job ${job.id}`, { makeupStyle, intensity });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const result = await callPerfectMakeupAPI(imageBuffer, makeupStyle, colors, intensity);
    const resultBuffer = result.imageBuffer;
    
    const key = `makeup/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, result.metadata);
    
    await recordApiUsage('perfect', '/makeup/tryon', userId, job.id, 1, { makeupStyle, intensity });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] makeup_tryon job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process skin analysis job
 */
async function processSkinAnalysis(job) {
  const { userId, imageKey, analysisType = 'full' } = job.data.payload;
  
  logger.info(`[aiWorker] Processing skin_analysis job ${job.id}`, { analysisType });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const analysisResult = await callPerfectSkinAPI(imageBuffer, analysisType);
    
    let resultKey, resultUrl, signedUrl;
    
    if (analysisResult.imageBuffer) {
      const key = `skin-analysis/${job.id}.png`;
      const uploadResult = await storage.uploadBuffer(analysisResult.imageBuffer, key, 'image/png');
      resultKey = uploadResult.key;
      resultUrl = uploadResult.url;
      signedUrl = await getSignedGetUrl(resultKey);
    }
    
    await updateJobStatus(job.id, 'completed', 
      resultKey ? { key: resultKey, url: resultUrl, signedUrl } : null, 
      null,
      analysisResult.metadata
    );
    
    await recordApiUsage('perfect', '/skin/analysis', userId, job.id, 2, { analysisType });
    
    return { ...analysisResult.metadata, resultKey, resultUrl, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] skin_analysis job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process hair style job
 */
async function processHairStyle(job) {
  const { userId, imageKey, hairStyle, hairColor, highlights } = job.data.payload;
  
  logger.info(`[aiWorker] Processing hair_style job ${job.id}`, { hairStyle, hairColor });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const resultBuffer = await callPerfectHairAPI(imageBuffer, hairStyle, hairColor, highlights);
    
    const key = `hair/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      hairStyle,
      hairColor,
      highlights,
    });
    
    await recordApiUsage('perfect', '/hair/style', userId, job.id, 1, { hairStyle, hairColor });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] hair_style job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process fashion try-on job
 */
async function processFashionTryon(job) {
  const { userId, personImageKey, garmentImageKey, category, fit = 'standard' } = job.data.payload;
  
  logger.info(`[aiWorker] Processing fashion_tryon job ${job.id}`, { category, fit });
  
  try {
    const [personBuffer, garmentBuffer] = await Promise.all([
      storage.getObjectBuffer(personImageKey),
      storage.getObjectBuffer(garmentImageKey),
    ]);
    
    const resultBuffer = await callPerfectVTONAPI(personBuffer, garmentBuffer, category, fit);
    
    const key = `fashion-tryon/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      category,
      fit,
    });
    
    await recordApiUsage('perfect', '/fashion/tryon', userId, job.id, 2, { category, fit });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] fashion_tryon job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process accessory try-on job
 */
async function processAccessoryTryon(job) {
  const { userId, imageKey, accessoryType, position } = job.data.payload;
  
  logger.info(`[aiWorker] Processing accessory_tryon job ${job.id}`, { accessoryType, position });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const resultBuffer = await callPerfectAccessoryAPI(imageBuffer, accessoryType, position);
    
    const key = `accessory/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      accessoryType,
      position,
    });
    
    await recordApiUsage('perfect', '/accessory/tryon', userId, job.id, 1, { accessoryType });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] accessory_tryon job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process creative lookbook job
 */
async function processCreativeLookbook(job) {
  const { userId, prompt, style, imageKeys } = job.data.payload;
  
  logger.info(`[aiWorker] Processing creative_lookbook job ${job.id}`, { prompt, style });
  
  try {
    const images = await Promise.all(imageKeys.map(key => storage.getObjectBuffer(key)));
    const resultBuffer = await callPerfectCreativeAPI(prompt, style, images);
    
    const key = `lookbook/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      prompt,
      style,
      imageCount: imageKeys.length,
    });
    
    await recordApiUsage('perfect', '/creative/lookbook', userId, job.id, 3, { prompt, style });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] creative_lookbook job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process fun filter job
 */
async function processFunFilter(job) {
  const { userId, imageKey, filterName, intensity = 1.0 } = job.data.payload;
  
  logger.info(`[aiWorker] Processing fun_filter job ${job.id}`, { filterName, intensity });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const resultBuffer = await callPerfectFilterAPI(imageBuffer, filterName, intensity);
    
    const key = `filters/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      filterName,
      intensity,
    });
    
    await recordApiUsage('perfect', '/fun/filter', userId, job.id, 0.5, { filterName });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] fun_filter job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Process avatar creation job
 */
async function processAvatarCreation(job) {
  const { userId, imageKey, avatarStyle } = job.data.payload;
  
  logger.info(`[aiWorker] Processing avatar_creation job ${job.id}`, { avatarStyle });
  
  try {
    const imageBuffer = await storage.getObjectBuffer(imageKey);
    const resultBuffer = await callPerfectAvatarAPI(imageBuffer, avatarStyle);
    
    const key = `avatar/${job.id}.png`;
    const { key: s3Key, url } = await storage.uploadBuffer(resultBuffer, key, 'image/png');
    const signedUrl = await getSignedGetUrl(s3Key);
    
    await updateJobStatus(job.id, 'completed', { key: s3Key, url, signedUrl }, null, {
      avatarStyle,
    });
    
    await recordApiUsage('perfect', '/avatar/create', userId, job.id, 2, { avatarStyle });
    
    return { s3Key, url, signedUrl };
  } catch (error) {
    logger.error(`[aiWorker] avatar_creation job ${job.id} failed`, { error: error.message });
    await updateJobStatus(job.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Main job processor
 */
async function processJob(job) {
  const startTime = Date.now();
  const { type } = job.data;
  
  logger.info(`[aiWorker] Processing job ${job.id}`, { type });
  
  try {
    let result;
    
    switch (type) {
      case 'makeup_tryon':
        result = await processMakeupTryon(job);
        break;
      case 'skin_analysis':
        result = await processSkinAnalysis(job);
        break;
      case 'hair_style':
        result = await processHairStyle(job);
        break;
      case 'fashion_tryon':
        result = await processFashionTryon(job);
        break;
      case 'accessory_tryon':
        result = await processAccessoryTryon(job);
        break;
      case 'creative_lookbook':
        result = await processCreativeLookbook(job);
        break;
      case 'fun_filter':
        result = await processFunFilter(job);
        break;
      case 'avatar_creation':
        result = await processAvatarCreation(job);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
    
    const duration = Date.now() - startTime;
    metrics.processed++;
    metrics.totalDuration += duration;
    
    logger.info(`[aiWorker] Job ${job.id} completed in ${duration}ms`, { type });
    
    return result;
  } catch (error) {
    metrics.failed++;
    throw error;
  }
}

// Create the worker
const worker = new Worker(QUEUE_NAME, processJob, {
  connection,
  concurrency: CONCURRENCY,
  removeOnComplete: {
    count: 100,
    age: 3600,
  },
  removeOnFail: {
    count: 500,
    age: 86400,
  },
});

// Event handlers
worker.on('completed', (job) => {
  logger.info(`[aiWorker] Job ${job.id} completed`, { type: job.data.type });
});

worker.on('failed', async (job, err) => {
  logger.error(`[aiWorker] Job ${job.id} failed`, { 
    type: job?.data?.type, 
    error: err.message,
    stack: err.stack 
  });
  
  try {
    await updateJobStatus(job.id, 'failed', null, err.message);
  } catch (dbError) {
    logger.error('[aiWorker] Failed to update job status in DB', { error: dbError.message });
  }
});

worker.on('error', (err) => {
  logger.error('[aiWorker] Worker error', { error: err.message });
});

worker.on('stalled', (jobId) => {
  logger.warn(`[aiWorker] Job ${jobId} stalled`);
});

// Health check endpoint
if (require.main === module) {
  const http = require('http');
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      const queueCounts = await getQueueCounts();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        worker: 'aiWorker',
        metrics,
        queue: queueCounts,
        timestamp: new Date().toISOString()
      }));
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        processed: metrics.processed,
        failed: metrics.failed,
        avgDurationMs: metrics.processed > 0 ? Math.round(metrics.totalDuration / metrics.processed) : 0,
        creditUsage: metrics.creditUsage,
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  
  const PORT = process.env.WORKER_PORT || 5003;
  server.listen(PORT, () => {
    logger.info(`[aiWorker] Health server listening on port ${PORT}`);
  });
}

logger.info(`[aiWorker] Started with concurrency ${CONCURRENCY}`);

module.exports = { worker, metrics };
