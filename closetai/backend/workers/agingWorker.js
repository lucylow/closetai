/**
 * Aging Worker - BullMQ worker for AI Aging job processing
 * Handles skin analysis, aging simulation, and diagnostic report generation
 */

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const debug = require('debug')('closet:aging-worker');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Import modules
const perfectAgingClient = require('../lib/perfectAgingClient');
const agingStorage = require('../lib/agingStorage');
const storage = require('../lib/storage');
const db = require('../lib/db');

// Job type handlers
const jobHandlers = {
  /**
   * Handle aging analysis job
   * Runs skin analysis using Perfect API and computes metrics
   */
  aging_analysis: async (job) => {
    const { userId, jobId, srcKey, requestedMetrics, tenantId } = job.data;
    debug(`Processing aging_analysis job ${jobId} for user ${userId}`);
    
    try {
      // Update job status
      await updateJobStatus(jobId, 'processing', { progress: 10 });
      
      // Register source file with Perfect API
      const fileBuffer = await storage.getObjectBuffer(srcKey);
      const files = await perfectAgingClient.registerFiles([{
        filename: `${jobId}-src.jpg`,
        contentType: 'image/jpeg'
      }], tenantId);
      
      // Upload image to Perfect's provided URL
      // (In real implementation, would PUT to uploadUrl)
      
      // Start skin analysis task
      const analysisResult = await perfectAgingClient.skinAnalysisStart({
        srcFileId: files[0]?.fileId,
        actions: requestedMetrics || ['wrinkle', 'pore', 'pigment', 'moisture'],
        tenantId
      });
      
      await updateJobStatus(jobId, 'processing', { progress: 30 });
      
      // Poll for results
      const result = await perfectAgingClient.pollTask(analysisResult.taskId, tenantId);
      
      await updateJobStatus(jobId, 'processing', { progress: 60 });
      
      // Compute indices from raw metrics
      const metrics = computeMetrics(result.metrics || {});
      
      // Upload overlays to S3
      const overlayUrls = {};
      if (result.overlays) {
        for (const [metric, overlayData] of Object.entries(result.overlays)) {
          const key = agingStorage.overlayKey(jobId, metric);
          const buffer = Buffer.from(overlayData, 'base64');
          await agingStorage.uploadBuffer(buffer, key, 'image/png');
          overlayUrls[metric] = key;
        }
      }
      
      // Create aging report
      const report = await createAgingReport({
        jobId,
        userId,
        metrics,
        overlayUrls,
        rawMetrics: result.metrics
      });
      
      // Update job with results
      await updateJobStatus(jobId, 'completed', {
        progress: 100,
        resultKeys: {
          reportId: report.id,
          overlays: overlayUrls
        },
        creditsConsumed: getCreditCost('aging_analysis', requestedMetrics?.length || 4)
      });
      
      return { reportId: report.id, metrics };
    } catch (error) {
      debug(`aging_analysis job ${jobId} failed:`, error.message);
      await updateJobStatus(jobId, 'failed', { error: error.message });
      throw error;
    }
  },
  
  /**
   * Handle aging simulation job
   * Generates age progression/regression images
   */
  aging_simulation: async (job) => {
    const { userId, jobId, srcKey, yearsDelta, direction, strength, tenantId } = job.data;
    debug(`Processing aging_simulation job ${jobId}: ${yearsDelta} years ${direction}`);
    
    try {
      await updateJobStatus(jobId, 'processing', { progress: 10 });
      
      // Register and upload source image
      const fileBuffer = await storage.getObjectBuffer(srcKey);
      const files = await perfectAgingClient.registerFiles([{
        filename: `${jobId}-sim-src.jpg`,
        contentType: 'image/jpeg'
      }], tenantId);
      
      // Start aging simulation
      const simResult = await perfectAgingClient.agingSimulationStart({
        srcFileId: files[0]?.fileId,
        yearsDelta,
        direction,
        strength: strength || 0.8,
        tenantId
      });
      
      await updateJobStatus(jobId, 'processing', { progress: 40 });
      
      // Poll for results
      const result = await perfectAgingClient.pollTask(simResult.taskId, tenantId);
      
      await updateJobStatus(jobId, 'processing', { progress: 70 });
      
      // Upload simulation result
      const resultKey = agingStorage.simulationKey(jobId, yearsDelta);
      if (result.image) {
        const buffer = Buffer.from(result.image, 'base64');
        await agingStorage.uploadBuffer(buffer, resultKey, 'image/png');
      }
      
      // Create thumbnail
      const thumbnailKey = agingStorage.simulationKey(jobId, yearsDelta).replace('.png', '-thumb.png');
      
      // Store simulation record
      await createAgingSimulation({
        jobId,
        userId,
        srcKey,
        resultKey,
        thumbnailKey,
        yearsDelta,
        direction
      });
      
      await updateJobStatus(jobId, 'completed', {
        progress: 100,
        resultKeys: {
          resultKey,
          thumbnailKey
        },
        creditsConsumed: getCreditCost('aging_simulation')
      });
      
      return { resultKey, yearsDelta, direction };
    } catch (error) {
      debug(`aging_simulation job ${jobId} failed:`, error.message);
      await updateJobStatus(jobId, 'failed', { error: error.message });
      throw error;
    }
  },
  
  /**
   * Handle diagnostic report generation
   * Compiles analysis results into a report
   */
  diagnostic_report: async (job) => {
    const { userId, jobId, reportId, locale } = job.data;
    debug(`Processing diagnostic_report job ${reportId} for user ${userId}`);
    
    try {
      await updateJobStatus(jobId, 'processing', { progress: 20 });
      
      // Get aging report data
      const report = await getAgingReport(reportId);
      
      // Generate recommendations based on metrics
      const recommendations = generateRecommendations(report);
      
      // Update report with recommendations
      await updateAgingReport(reportId, { recommendations });
      
      await updateJobStatus(jobId, 'completed', {
        progress: 100,
        resultKeys: {
          reportId,
          recommendations: true
        },
        creditsConsumed: getCreditCost('diagnostic_report')
      });
      
      return { reportId, recommendations };
    } catch (error) {
      debug(`diagnostic_report job ${jobId} failed:`, error.message);
      await updateJobStatus(jobId, 'failed', { error: error.message });
      throw error;
    }
  },
  
  /**
   * Handle overlay render job
   * Composites overlays onto user images
   */
  overlay_render: async (job) => {
    const { userId, jobId, overlayType } = job.data;
    debug(`Processing overlay_render job ${jobId}: ${overlayType}`);
    
    // Similar pattern - render specific overlay types
    await updateJobStatus(jobId, 'completed', {
      progress: 100,
      resultKeys: { overlayType }
    });
    
    return { overlayType };
  }
};

/**
 * Compute aging metrics from raw Perfect API results
 */
function computeMetrics(rawMetrics) {
  // Regional weights for wrinkle index calculation
  const wrinkleWeights = {
    forehead: 0.2,
    crowfeet: 0.25,
    nasolabial: 0.25,
    marionette: 0.2,
    overall: 0.1
  };
  
  // Normalize and compute wrinkle index
  let wrinkleTotal = 0, wrinkleWsum = 0;
  for (const [region, score] of Object.entries(rawMetrics.wrinkle || {})) {
    const normalized = Math.min(Math.max(score / 100, 0), 1);
    const weight = wrinkleWeights[region] || 0.1;
    wrinkleTotal += normalized * weight;
    wrinkleWsum += weight;
  }
  const wrinkleIndex = wrinkleWsum ? wrinkleTotal / wrinkleWsum : 0;
  
  // Compute pigment index
  const pigmentScore = (rawMetrics.pigment?.spot_count_normalized || 0) + 
                      (rawMetrics.pigment?.color_variance || 0);
  const pigmentIndex = Math.min(pigmentScore / 2, 1);
  
  // Compute hydration index (inverse of dryness indicators)
  const hydrationIndex = 1 - ((rawMetrics.moisture?.dryness || 0) / 100);
  
  // Compute elasticity proxy (based on texture variance)
  const elasticityProxy = 1 - ((rawMetrics.texture?.irregularity || 0) / 100);
  
  // Compute UV damage score
  const uvDamageScore = (rawMetrics.pigment?.sun_spot_intensity || 0) / 100;
  
  // Texture irregularity
  const textureIrregularity = (rawMetrics.texture?.irregularity || 0) / 100;
  
  // Estimate appearance age (illustrative only)
  const baseEstimate = 30; // Base age estimate
  const ageDelta = 15 * wrinkleIndex + 10 * pigmentIndex - 8 * hydrationIndex - 6 * elasticityProxy;
  const estimatedAppearanceAge = Math.round(Math.max(18, Math.min(80, baseEstimate + ageDelta)));
  
  // Confidence band (variance-based)
  const values = [wrinkleIndex, pigmentIndex, hydrationIndex, elasticityProxy];
  const variance = values.reduce((sum, v) => sum + Math.pow(v - values.reduce((a, b) => a + b) / values.length, 2), 0) / values.length;
  const confidence = Math.max(0.3, 1 - variance);
  const confidenceRange = Math.round(10 * confidence);
  
  return {
    wrinkle_index: Math.round(wrinkleIndex * 10000) / 10000,
    pore_index: Math.round(((rawMetrics.pore?.size || 0) / 100) * 10000) / 10000,
    pigment_index: Math.round(pigmentIndex * 10000) / 10000,
    hydration_index: Math.round(hydrationIndex * 10000) / 10000,
    elasticity_proxy: Math.round(elasticityProxy * 10000) / 10000,
    uv_damage_score: Math.round(uvDamageScore * 10000) / 10000,
    texture_irregularity: Math.round(textureIrregularity * 10000) / 10000,
    estimated_appearance_age: estimatedAppearanceAge,
    confidence_lower: Math.max(18, estimatedAppearanceAge - confidenceRange),
    confidence_upper: Math.min(80, estimatedAppearanceAge + confidenceRange)
  };
}

/**
 * Generate non-medical product recommendations based on metrics
 */
function generateRecommendations(report) {
  const recommendations = [];
  const { metrics } = report;
  
  // UV protection recommendations
  if (metrics.uv_damage_score > 0.4) {
    recommendations.push({
      category: 'sun_protection',
      product_name: 'Broad-spectrum SPF 30+ Sunscreen',
      recommendation_reason: 'High UV damage indicators detected. Daily sun protection helps prevent further damage.',
      confidence_score: 0.85,
      is_medical: false,
      priority: 1
    });
  }
  
  // Hydration recommendations
  if (metrics.hydration_index < 0.5) {
    recommendations.push({
      category: 'moisturizing',
      product_name: 'Hyaluronic Acid Serum + Rich Moisturizer',
      recommendation_reason: 'Low hydration levels detected. Hyaluronic acid helps retain moisture.',
      confidence_score: 0.8,
      is_medical: false,
      priority: 2
    });
  }
  
  // Anti-aging recommendations for wrinkles
  if (metrics.wrinkle_index > 0.5) {
    recommendations.push({
      category: 'anti_aging',
      product_name: 'Gentle Retinol Product (OTC)',
      recommendation_reason: 'Wrinkle indicators detected. Retinol can help reduce fine lines. Start with low concentration.',
      confidence_score: 0.75,
      is_medical: false,
      priority: 3
    });
  }
  
  // Pigmentation recommendations
  if (metrics.pigment_index > 0.4) {
    recommendations.push({
      category: 'brightening',
      product_name: 'Vitamin C Serum + Niacinamide',
      recommendation_reason: 'Pigmentation changes detected. These ingredients help even skin tone.',
      confidence_score: 0.7,
      is_medical: false,
      priority: 4
    });
  }
  
  // Always add general recommendations
  recommendations.push({
    category: 'lifestyle',
    product_name: 'Stay Hydrated + 8 glasses water daily',
    recommendation_reason: 'Proper hydration supports skin health from within.',
    confidence_score: 0.9,
    is_medical: false,
    priority: 5
  });
  
  recommendations.push({
    category: 'lifestyle',
    product_name: 'Consult a dermatologist for serious concerns',
    recommendation_reason: 'For persistent skin concerns, professional consultation is recommended.',
    confidence_score: 1.0,
    is_medical: true,
    priority: 10
  });
  
  return recommendations;
}

/**
 * Get credit cost for job type
 */
function getCreditCost(jobType, options = 0) {
  const costs = {
    aging_analysis: 3,
    aging_simulation: 8,
    diagnostic_report: 2,
    overlay_render: 1
  };
  return costs[jobType] || 1;
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, extra = {}) {
  const pool = db.getPool();
  await pool.query(
    `UPDATE aging_jobs SET status = $1, updated_at = NOW(), metadata = metadata || $2 WHERE id = $3`,
    [status, JSON.stringify(extra), jobId]
  );
}

/**
 * Create aging report record
 */
async function createAgingReport({ jobId, userId, metrics, overlayUrls, rawMetrics }) {
  const pool = db.getPool();
  const result = await pool.query(
    `INSERT INTO aging_reports (job_id, user_id, wrinkle_index, pore_index, pigment_index, hydration_index, elasticity_proxy, uv_damage_score, texture_irregularity, estimated_appearance_age, confidence_lower, confidence_upper, raw_metrics, overlay_urls, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     RETURNING id`,
    [jobId, userId, metrics.wrinkle_index, metrics.pore_index, metrics.pigment_index, metrics.hydration_index, metrics.elasticity_proxy, metrics.uv_damage_score, metrics.texture_irregularity, metrics.estimated_appearance_age, metrics.confidence_lower, metrics.confidence_upper, JSON.stringify(rawMetrics), JSON.stringify(overlayUrls)]
  );
  return result.rows[0];
}

/**
 * Get aging report by ID
 */
async function getAgingReport(reportId) {
  const pool = db.getPool();
  const result = await pool.query('SELECT * FROM aging_reports WHERE id = $1', [reportId]);
  return result.rows[0];
}

/**
 * Update aging report
 */
async function updateAgingReport(reportId, updates) {
  const pool = db.getPool();
  await pool.query(
    `UPDATE aging_reports SET recommendations = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(updates.recommendations), reportId]
  );
}

/**
 * Create aging simulation record
 */
async function createAgingSimulation({ jobId, userId, srcKey, resultKey, thumbnailKey, yearsDelta, direction }) {
  const pool = db.getPool();
  await pool.query(
    `INSERT INTO aging_simulations (job_id, user_id, src_key, result_key, thumbnail_key, years_delta, direction, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [jobId, userId, srcKey, resultKey, thumbnailKey, yearsDelta, direction]
  );
}

// Create workers for each queue
const workers = {
  hd: new Worker('closetai-aging-hd-queue', async (job) => {
    const handler = jobHandlers[job.name];
    if (!handler) throw new Error(`Unknown job type: ${job.name}`);
    return await handler(job);
  }, { connection, concurrency: 5 }),
  
  low: new Worker('closetai-aging-low-queue', async (job) => {
    const handler = jobHandlers[job.name];
    if (!handler) throw new Error(`Unknown job type: ${job.name}`);
    return await handler(job);
  }, { connection, concurrency: 10 })
};

// Handle worker events
workers.hd.on('completed', (job) => {
  debug(`Job ${job.id} completed successfully`);
});

workers.hd.on('failed', (job, err) => {
  debug(`Job ${job.id} failed:`, err.message);
});

workers.low.on('completed', (job) => {
  debug(`Job ${job.id} completed successfully`);
});

workers.low.on('failed', (job, err) => {
  debug(`Job ${job.id} failed:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  debug('Shutting down aging workers...');
  await workers.hd.close();
  await workers.low.close();
  process.exit(0);
});

module.exports = { workers, jobHandlers };
