// backend/workers/genWorker.js
// Comprehensive generation worker for multi-feature processing
// Handles: text2img, image-edit, tryon, pbr, background-removal, segmentation, depth-map, attribute-extraction

require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const debug = require('debug')('closet:gen-worker');

// Database client (minimal pg wrapper)
const db = require('../lib/db');

// Storage module
const storage = require('../lib/storage');

// Perfect Corp client
const perfect = require('../lib/perfectClient');

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Queue name
const QUEUE_NAME = process.env.GEN_QUEUE_NAME || 'closetai-gen-queue';

// Worker concurrency
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 2;

/**
 * Get signed URL for S3 key
 */
function getSignedUrl(key, expiresSeconds = 300) {
  return storage.getSignedUrlForKey(key, expiresSeconds);
}

/**
 * Process response from Perfect API - handle base64 or URL returns
 */
async function processProviderResponse(resp, job) {
  let buffer;
  
  if (resp.data.image_base64) {
    // Direct base64 return
    buffer = Buffer.from(resp.data.image_base64, 'base64');
  } else if (resp.data.image_url) {
    // URL return - download and upload to our storage
    job.updateProgress(50);
    const response = await axios.get(resp.data.image_url, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
  } else if (resp.data.result_url) {
    // Alternative result URL field
    job.updateProgress(50);
    const response = await axios.get(resp.data.result_url, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
  } else if (resp.data.images && Array.isArray(resp.data.images)) {
    // Batch return - handle first image for now
    const imageData = resp.data.images[0];
    if (imageData.base64) {
      buffer = Buffer.from(imageData.base64, 'base64');
    } else if (imageData.url) {
      job.updateProgress(50);
      const response = await axios.get(imageData.url, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data);
    }
  } else {
    throw new Error('No image returned from provider');
  }
  
  return buffer;
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, resultKeys = null, error = null, metadata = null) {
  try {
    await db.query(
      `UPDATE gen_jobs 
       SET status = $1, result_key = $2, error_message = $3, metadata = COALESCE($4, metadata), updated_at = NOW()
       WHERE id = $6`,
      [status, resultKeys ? JSON.stringify(resultKeys) : null, error, metadata, jobId]
    );
  } catch (err) {
    debug('Failed to update job status:', err.message);
  }
}

/**
 * Record API usage for billing
 */
async function recordApiUsage(tenantId, jobId, provider, creditsUsed, headers) {
  try {
    await db.query(
      `INSERT INTO api_usage (provider, tenant_id, job_id, credits_used, headers, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [provider, tenantId, jobId, creditsUsed, JSON.stringify(headers)]
    );
  } catch (err) {
    debug('Failed to record API usage:', err.message);
  }
}

// Create the worker
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { type, payload } = job.data;
    const { userId, tenantId, ...params } = payload;
    
    debug('Processing job:', job.id, type);
    
    // Update initial progress
    job.updateProgress(5);
    
    // Ensure job record exists (idempotency)
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, tenant_id, type, status, prompt, created_at)
       VALUES ($1, $2, $3, $4, 'processing', $5, NOW())
       ON CONFLICT (id) DO UPDATE SET status = 'processing', updated_at = NOW()`,
      [job.id, userId, tenantId, type, params.prompt || null]
    );
    
    let result;
    
    switch (type) {
      // ==========================================
      // Text to Image Generation
      // ==========================================
      case 'text2img': {
        const { prompt, width = 1024, height = 1024, style, negativePrompt, seed } = params;
        
        job.updateProgress(20);
        
        const resp = await perfect.text2img({
          prompt,
          width,
          height,
          style,
          negative_prompt: negativePrompt,
          seed
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        // Upload to S3
        const key = storage.tenantKey(tenantId, `generations/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        // Record API usage
        const credits = resp.headers['x-credit-remaining'];
        if (credits) {
          await recordApiUsage(tenantId, job.id, 'perfect', null, resp.headers);
        }
        
        result = { key: uploaded.key, type: 'text2img' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Image Edit / Inpainting
      // ==========================================
      case 'edit':
      case 'image-edit': {
        const { imageKey, prompt, maskKey, strength = 0.7 } = params;
        
        job.updateProgress(20);
        
        // Get signed URLs for input images
        const imageUrl = getSignedUrl(imageKey);
        const maskUrl = maskKey ? getSignedUrl(maskKey) : undefined;
        
        const resp = await perfect.imageEdit({
          image_url: imageUrl,
          prompt,
          mask_url: maskUrl,
          strength
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        // Upload to S3
        const key = storage.tenantKey(tenantId, `edits/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'image-edit' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Virtual Try-On
      // ==========================================
      case 'tryon': {
        const { personImageKey, itemImageKey, category = 'top', fit = 'standard' } = params;
        
        job.updateProgress(20);
        
        // Get signed URLs
        const personUrl = getSignedUrl(personImageKey);
        const itemUrl = getSignedUrl(itemImageKey);
        
        const resp = await perfect.tryOn({
          person_image_url: personUrl,
          item_image_url: itemUrl,
          category,
          fit
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        // Upload main result
        const key = storage.tenantKey(tenantId, `tryon/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        // Handle additional outputs (segmentation, depth)
        const extra = {};
        
        if (resp.data.segmentation_base64) {
          const segBuffer = Buffer.from(resp.data.segmentation_base64, 'base64');
          const segKey = storage.tenantKey(tenantId, `tryon/${job.id}-seg.png`);
          await storage.uploadBuffer(segBuffer, segKey, 'image/png');
          extra.segmentation = segKey;
        }
        
        if (resp.data.depth_base64) {
          const depthBuffer = Buffer.from(resp.data.depth_base64, 'base64');
          const depthKey = storage.tenantKey(tenantId, `tryon/${job.id}-depth.png`);
          await storage.uploadBuffer(depthBuffer, depthKey, 'image/png');
          extra.depth = depthKey;
        }
        
        job.updateProgress(90);
        
        const resultKeys = [uploaded.key, ...Object.values(extra)];
        
        result = { 
          key: uploaded.key, 
          type: 'tryon',
          extra 
        };
        
        await updateJobStatus(job.id, 'completed', resultKeys, null, extra);
        
        break;
      }
      
      // ==========================================
      // Background Removal
      // ==========================================
      case 'remove-bg':
      case 'background-removal': {
        const { imageKey } = params;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.removeBackground({
          image_url: imageUrl
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        // Upload result (PNG with alpha)
        const key = storage.tenantKey(tenantId, `backgrounds/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'background-removal' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Person Segmentation
      // ==========================================
      case 'segmentation':
      case 'person-segmentation': {
        const { imageKey } = params;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.personSegmentation({
          image_url: imageUrl
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        const key = storage.tenantKey(tenantId, `segmentation/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'segmentation' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Depth Map Generation
      // ==========================================
      case 'depth-map': {
        const { imageKey } = params;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.depthMap({
          image_url: imageUrl
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        const key = storage.tenantKey(tenantId, `depth/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'depth-map' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Attribute Extraction
      // ==========================================
      case 'attributes':
      case 'attribute-extraction': {
        const { imageKey } = params;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.extractAttributes({
          image_url: imageUrl
        }, tenantId);
        
        job.updateProgress(90);
        
        // Attributes are returned as JSON
        const attributes = resp.data.attributes || resp.data;
        
        result = { 
          type: 'attribute-extraction',
          attributes 
        };
        
        await updateJobStatus(job.id, 'completed', null, null, attributes);
        
        break;
      }
      
      // ==========================================
      // PBR Texture Generation
      // ==========================================
      case 'pbr': {
        const { productImageKey, maps = ['albedo', 'normal', 'roughness'], prompt, resolution = 2048 } = params;
        
        job.updateProgress(10);
        
        const productUrl = getSignedUrl(productImageKey);
        
        const generatedMaps = {};
        
        // Generate each map type
        for (let i = 0; i < maps.length; i++) {
          const mapName = maps[i];
          job.updateProgress(20 + (i * 60 / maps.length));
          
          // Use text2img with map-specific prompts
          const mapPrompt = `${prompt} generate ${mapName} map for PBR texture`;
          
          const resp = await perfect.text2img({
            prompt: mapPrompt,
            width: resolution,
            height: resolution,
            style: 'pbr-texture'
          }, tenantId);
          
          const buffer = await processProviderResponse(resp, job);
          
          // Upload map
          const mapKey = storage.tenantKey(tenantId, `pbr/${job.id}/${mapName}.png`);
          const uploaded = await storage.uploadBuffer(buffer, mapKey, 'image/png');
          
          generatedMaps[mapName] = uploaded.key;
        }
        
        job.updateProgress(90);
        
        // Store PBR asset reference
        await db.query(
          `INSERT INTO pbr_assets (job_id, maps, created_at)
           VALUES ($1, $2, NOW())`,
          [job.id, JSON.stringify(generatedMaps)]
        );
        
        result = { 
          type: 'pbr',
          maps: generatedMaps 
        };
        
        const mapKeys = Object.values(generatedMaps);
        await updateJobStatus(job.id, 'completed', mapKeys);
        
        break;
      }
      
      // ==========================================
      // Batch Processing
      // ==========================================
      case 'batch': {
        const { jobs: batchJobs } = params;
        
        job.updateProgress(5);
        
        const results = [];
        
        for (let i = 0; i < batchJobs.length; i++) {
          const batchItem = batchJobs[i];
          const progress = 5 + (i / batchJobs.length) * 90;
          
          job.updateProgress(progress);
          
          // Process each item recursively
          try {
            const subJob = await db.query(
              `INSERT INTO gen_jobs (id, user_id, tenant_id, type, status, prompt, created_at)
               VALUES ($1, $2, $3, $4, 'processing', $5, NOW())
               ON CONFLICT (id) DO NOTHING
               RETURNING id`,
              [`${job.id}-${i}`, userId, tenantId, batchItem.type, batchItem.prompt]
            );
            
            // For now, we'll handle single items; full batch would call worker recursively
            results.push({ index: i, status: 'queued', subJobId: subJob.rows[0]?.id });
          } catch (err) {
            results.push({ index: i, status: 'error', error: err.message });
          }
        }
        
        job.updateProgress(95);
        
        result = { 
          type: 'batch',
          total: batchJobs.length,
          results 
        };
        
        await updateJobStatus(job.id, 'completed', null, null, { batchResults: results });
        
        break;
      }
      
      // ==========================================
      // Self-Editing (Auto Crop, Background Remove, Auto-Enhance)
      // ==========================================
      case 'self_edit': {
        const { imageKey, options = {} } = params;
        const { crop, removeBg, enhance, autoColor, autoBrightness } = options;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        // Build the request based on options
        const requestPayload = { image_url: imageUrl };
        
        if (enhance || autoColor || autoBrightness) {
          requestPayload.auto_enhance = true;
          requestPayload.auto_color = autoColor !== false;
          requestPayload.auto_brightness = autoBrightness !== false;
        }
        
        if (removeBg) {
          // Use background removal endpoint
          const resp = await perfect.removeBackground({
            image_url: imageUrl
          }, tenantId);
          
          job.updateProgress(60);
          
          const buffer = await processProviderResponse(resp, job);
          
          // If also cropping, we'd need additional processing
          const key = storage.tenantKey(tenantId, `selfedit/${job.id}.png`);
          const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
          
          result = { key: uploaded.key, type: 'self_edit', operations: ['remove_bg'] };
          await updateJobStatus(job.id, 'completed', [uploaded.key]);
        } else if (enhance) {
          // Use auto enhance endpoint
          const resp = await perfect.autoEnhance(requestPayload, tenantId);
          
          job.updateProgress(60);
          
          const buffer = await processProviderResponse(resp, job);
          
          const key = storage.tenantKey(tenantId, `selfedit/${job.id}.png`);
          const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
          
          result = { key: uploaded.key, type: 'self_edit', operations: ['enhance'] };
          await updateJobStatus(job.id, 'completed', [uploaded.key]);
        } else {
          // Default: just return the original for now
          result = { key: imageKey, type: 'self_edit', operations: [] };
          await updateJobStatus(job.id, 'completed', [imageKey]);
        }
        
        job.updateProgress(90);
        
        break;
      }
      
      // ==========================================
      // Beautification (Face Filters, Skin Tuning)
      // ==========================================
      case 'beautify': {
        const { imageKey, options = {} } = params;
        const { faceFilter, skinSmoothing, blemishRemoval, relighting, intensity = 0.8 } = options;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.beautify({
          image_url: imageUrl,
          face_filter: faceFilter || 'natural',
          skin_smoothing: skinSmoothing !== false,
          blemish_removal: blemishRemoval !== false,
          relighting: relighting || false,
          intensity
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        const key = storage.tenantKey(tenantId, `beautify/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'beautify' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Avatar Creation
      // ==========================================
      case 'avatar_create': {
        const { imageKey, style = 'cartoon' } = params;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.createAvatar({
          image_url: imageUrl,
          style
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        const key = storage.tenantKey(tenantId, `avatar/${job.id}.png`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'image/png');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'avatar_create', style };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Video Generation
      // ==========================================
      case 'video_generate': {
        const { imageKeys, options = {} } = params;
        const { fps = 30, duration = 4, transition = 'fade', platform = 'instagram' } = options;
        
        job.updateProgress(10);
        
        // Get signed URLs for all images
        const imageUrls = imageKeys.map(key => getSignedUrl(key));
        
        const resp = await perfect.generateVideo({
          image_urls: imageUrls,
          fps,
          duration,
          transition,
          output_format: 'mp4'
        }, tenantId);
        
        job.updateProgress(50);
        
        // Handle video response (could be URL or base64)
        let buffer;
        if (resp.data.video_base64) {
          buffer = Buffer.from(resp.data.video_base64, 'base64');
        } else if (resp.data.video_url) {
          const response = await axios.get(resp.data.video_url, { responseType: 'arraybuffer' });
          buffer = Buffer.from(response.data);
        } else {
          throw new Error('No video returned from provider');
        }
        
        const key = storage.tenantKey(tenantId, `video/${job.id}.mp4`);
        const uploaded = await storage.uploadBuffer(buffer, key, 'video/mp4');
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'video_generate' };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Social Media Export
      // ==========================================
      case 'social_export': {
        const { imageKey, platform = 'instagram', format = 'image', options = {} } = params;
        const { aspectRatio = '1:1' } = options;
        
        job.updateProgress(20);
        
        const imageUrl = getSignedUrl(imageKey);
        
        const resp = await perfect.socialExport({
          image_url: imageUrl,
          platform,
          format,
          aspect_ratio: aspectRatio
        }, tenantId);
        
        job.updateProgress(60);
        
        const buffer = await processProviderResponse(resp, job);
        
        const mimeType = format === 'video' ? 'video/mp4' : 'image/jpeg';
        const ext = format === 'video' ? 'mp4' : 'jpg';
        const key = storage.tenantKey(tenantId, `social/${platform}/${job.id}.${ext}`);
        const uploaded = await storage.uploadBuffer(buffer, key, mimeType);
        
        job.updateProgress(90);
        
        result = { key: uploaded.key, type: 'social_export', platform, format };
        
        await updateJobStatus(job.id, 'completed', [uploaded.key]);
        
        break;
      }
      
      // ==========================================
      // Unknown job type
      // ==========================================
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
    
    job.updateProgress(100);
    
    debug('Job completed:', job.id, type);
    
    return result;
    
  },
  {
    connection,
    concurrency: CONCURRENCY,
    limiter: {
      max: 10,
      duration: 1000
    }
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  debug(`Job ${job.id} completed. Result:`, job.returnvalue);
});

worker.on('failed', async (job, err) => {
  debug(`Job ${job.id} failed:`, err.message);
  
  // Update job status in database
  try {
    await db.query(
      `UPDATE gen_jobs SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
      [err.message, job.id]
    );
  } catch (dbErr) {
    debug('Failed to update job status:', dbErr.message);
  }
});

worker.on('progress', (job, progress) => {
  debug(`Job ${job.id} progress: ${progress}%`);
});

worker.on('stalled', (jobId) => {
  debug(`Job ${jobId} stalled - will be retried`);
});

console.log(`Generation worker started for queue: ${QUEUE_NAME} (concurrency: ${CONCURRENCY})`);

module.exports = worker;
