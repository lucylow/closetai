/**
 * AI Routes - Perfect/YouCam API endpoints
 * Handles: makeup try-on, skin analysis, hair styling, fashion try-on,
 *          accessory try-on, creative lookbooks, fun filters, avatar creation
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { enqueueJob } = require('../lib/queue');
const storage = require('../lib/storage');
const db = require('../lib/db');
const logger = require('../utils/logger');
const creditService = require('../services/creditService');
const pricingService = require('../services/pricingService');

const router = express.Router();

/**
 * GET /api/ai/credits
 * Get user's credit balance
 * 
 * Response: { balance, usage, plans, packages }
 */
router.get('/credits', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const [credits, usageStats, userPlan, plans, packages] = await Promise.all([
      creditService.getUserCredits(userId),
      creditService.getUserUsageStats(userId, 30),
      pricingService.getUserPlan(userId),
      Promise.resolve(pricingService.getPlans()),
      Promise.resolve(pricingService.getCreditPackages())
    ]);
    
    res.json({
      balance: credits.balance,
      usage: usageStats,
      plan: userPlan,
      plans: plans.filter(p => p.price > 0),
      packages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/upload-url
 * Get a signed URL for uploading images
 * 
 * Body: { filename, contentType, folder }
 * Response: { uploadUrl, key, publicUrl }
 */
router.post('/upload-url', authenticate, async (req, res, next) => {
  try {
    const { filename, contentType = 'image/jpeg', folder = 'uploads' } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'filename is required' });
    }
    
    const userId = req.user.id;
    const uniqueId = uuidv4();
    const ext = filename.split('.').pop();
    const key = `${folder}/${userId}/${uniqueId}.${ext}`;
    
    // Get signed PUT URL
    const uploadUrl = await storage.getSignedPutUrl(userId, key, contentType);
    
    res.json({
      uploadUrl,
      key,
      publicUrl: storage.getPublicUrlForKey(key),
      expiresIn: 3600,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/makeup
 * Create a makeup try-on job
 * 
 * Body: { imageKey, makeupStyle, colors, intensity }
 * Response: { jobId, status }
 */
router.post('/makeup', authenticate, async (req, res, next) => {
  try {
    const { imageKey, makeupStyle, colors, intensity = 0.8 } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    // Check credits before creating job
    const creditCheck = await creditService.hasCredits(userId, 'makeup_tryon');
    if (!creditCheck.allowed) {
      // Get available plans/packages for purchase
      const packages = pricingService.getCreditPackages();
      const plans = pricingService.getPlans();
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditCheck.cost,
        remaining: creditCheck.remaining,
        message: 'Please purchase credits or upgrade your plan to continue.',
        packages,
        plans: plans.filter(p => p.price > 0)
      });
    }
    
    // Check feature access
    const hasFeature = await pricingService.hasFeature(userId, 'makeup_tryon');
    if (!hasFeature) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Upgrade your plan to access this feature.',
        plan: await pricingService.getUserPlan(userId)
      });
    }
    
    // Create job in database
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'makeup_tryon', 'queued', JSON.stringify({ makeupStyle, colors, intensity }), imageKey]
    );
    
    // Enqueue job
    await enqueueJob('makeup_tryon', {
      type: 'makeup_tryon',
      payload: {
        userId,
        imageKey,
        makeupStyle,
        colors,
        intensity,
      },
    }, {
      jobId,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { count: 100 },
    });
    
    // Deduct credits after successful job creation
    await creditService.deductCredits(userId, 'makeup_tryon', jobId, { makeupStyle, intensity });
    
    // Get updated credit balance
    const { balance } = await creditService.getUserCredits(userId);
    
    logger.info('[aiRoutes] Created makeup job', { jobId, userId, makeupStyle });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Makeup try-on job created',
      creditsRemaining: balance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/skin
 * Create a skin analysis job
 * 
 * Body: { imageKey, analysisType }
 * Response: { jobId, status }
 */
router.post('/skin', authenticate, async (req, res, next) => {
  try {
    const { imageKey, analysisType = 'full' } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'skin_analysis', 'queued', JSON.stringify({ analysisType }), imageKey]
    );
    
    await enqueueJob('skin_analysis', {
      type: 'skin_analysis',
      payload: {
        userId,
        imageKey,
        analysisType,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created skin analysis job', { jobId, userId, analysisType });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Skin analysis job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/hair
 * Create a hair styling job
 * 
 * Body: { imageKey, hairStyle, hairColor, highlights }
 * Response: { jobId, status }
 */
router.post('/hair', authenticate, async (req, res, next) => {
  try {
    const { imageKey, hairStyle, hairColor, highlights } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    if (!hairStyle) {
      return res.status(400).json({ error: 'hairStyle is required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'hair_style', 'queued', JSON.stringify({ hairStyle, hairColor, highlights }), imageKey]
    );
    
    await enqueueJob('hair_style', {
      type: 'hair_style',
      payload: {
        userId,
        imageKey,
        hairStyle,
        hairColor,
        highlights,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created hair style job', { jobId, userId, hairStyle });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Hair styling job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/fashion
 * Create a fashion try-on job
 * 
 * Body: { personImageKey, garmentImageKey, category, fit }
 * Response: { jobId, status }
 */
router.post('/fashion', authenticate, async (req, res, next) => {
  try {
    const { personImageKey, garmentImageKey, category = 'top', fit = 'standard' } = req.body;
    const userId = req.user.id;
    
    if (!personImageKey || !garmentImageKey) {
      return res.status(400).json({ error: 'personImageKey and garmentImageKey are required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'fashion_tryon', 'queued', JSON.stringify({ category, fit }), personImageKey]
    );
    
    await enqueueJob('fashion_tryon', {
      type: 'fashion_tryon',
      payload: {
        userId,
        personImageKey,
        garmentImageKey,
        category,
        fit,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created fashion try-on job', { jobId, userId, category });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Fashion try-on job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/accessory
 * Create an accessory try-on job
 * 
 * Body: { imageKey, accessoryType, position }
 * Response: { jobId, status }
 */
router.post('/accessory', authenticate, async (req, res, next) => {
  try {
    const { imageKey, accessoryType, position } = req.body;
    const userId = req.user.id;
    
    if (!imageKey || !accessoryType) {
      return res.status(400).json({ error: 'imageKey and accessoryType are required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'accessory_tryon', 'queued', JSON.stringify({ accessoryType, position }), imageKey]
    );
    
    await enqueueJob('accessory_tryon', {
      type: 'accessory_tryon',
      payload: {
        userId,
        imageKey,
        accessoryType,
        position,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created accessory try-on job', { jobId, userId, accessoryType });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Accessory try-on job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/creative/lookbook
 * Create a creative lookbook job
 * 
 * Body: { prompt, style, imageKeys }
 * Response: { jobId, status }
 */
router.post('/creative/lookbook', authenticate, async (req, res, next) => {
  try {
    const { prompt, style, imageKeys } = req.body;
    const userId = req.user.id;
    
    if (!prompt && (!imageKeys || imageKeys.length === 0)) {
      return res.status(400).json({ error: 'prompt or imageKeys are required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'creative_lookbook', 'queued', JSON.stringify({ prompt, style }), imageKeys?.[0]]
    );
    
    await enqueueJob('creative_lookbook', {
      type: 'creative_lookbook',
      payload: {
        userId,
        prompt,
        style,
        imageKeys: imageKeys || [],
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created creative lookbook job', { jobId, userId, prompt });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Creative lookbook job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/fun/filter
 * Create a fun filter job
 * 
 * Body: { imageKey, filterName, intensity }
 * Response: { jobId, status }
 */
router.post('/fun/filter', authenticate, async (req, res, next) => {
  try {
    const { imageKey, filterName, intensity = 1.0 } = req.body;
    const userId = req.user.id;
    
    if (!imageKey || !filterName) {
      return res.status(400).json({ error: 'imageKey and filterName are required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'fun_filter', 'queued', JSON.stringify({ filterName, intensity }), imageKey]
    );
    
    await enqueueJob('fun_filter', {
      type: 'fun_filter',
      payload: {
        userId,
        imageKey,
        filterName,
        intensity,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created fun filter job', { jobId, userId, filterName });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Fun filter job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/selfedit
 * Self-editing features: auto crop, background remove, auto-enhance
 * 
 * Body: { imageKey, options: { crop, removeBg, enhance, autoColor, autoBrightness } }
 * Response: { jobId, status }
 */
router.post('/selfedit', authenticate, async (req, res, next) => {
  try {
    const { imageKey, options = {} } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    // Check credits
    const creditCheck = await creditService.hasCredits(userId, 'self_edit');
    if (!creditCheck.allowed) {
      const packages = pricingService.getCreditPackages();
      const plans = pricingService.getPlans();
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditCheck.cost,
        remaining: creditCheck.remaining,
        message: 'Please purchase credits or upgrade your plan to continue.',
        packages,
        plans: plans.filter(p => p.price > 0)
      });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'self_edit', 'queued', JSON.stringify(options), imageKey]
    );
    
    await enqueueJob('self_edit', {
      type: 'self_edit',
      payload: {
        userId,
        imageKey,
        options,
      },
    }, {
      jobId,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { count: 100 },
    });
    
    await creditService.deductCredits(userId, 'self_edit', jobId, options);
    
    const { balance } = await creditService.getUserCredits(userId);
    
    logger.info('[aiRoutes] Created self-edit job', { jobId, userId, options });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Self-editing job created',
      creditsRemaining: balance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/beautify
 * Beautification tools: face filters, skin tuning, blemish removal, relighting
 * 
 * Body: { imageKey, options: { faceFilter, skinSmoothing, blemishRemoval, relighting, intensity } }
 * Response: { jobId, status }
 */
router.post('/beautify', authenticate, async (req, res, next) => {
  try {
    const { imageKey, options = {} } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    // Check credits
    const creditCheck = await creditService.hasCredits(userId, 'beautify');
    if (!creditCheck.allowed) {
      const packages = pricingService.getCreditPackages();
      const plans = pricingService.getPlans();
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditCheck.cost,
        remaining: creditCheck.remaining,
        message: 'Please purchase credits or upgrade your plan to continue.',
        packages,
        plans: plans.filter(p => p.price > 0)
      });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'beautify', 'queued', JSON.stringify(options), imageKey]
    );
    
    await enqueueJob('beautify', {
      type: 'beautify',
      payload: {
        userId,
        imageKey,
        options,
      },
    }, {
      jobId,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { count: 100 },
    });
    
    await creditService.deductCredits(userId, 'beautify', jobId, options);
    
    const { balance } = await creditService.getUserCredits(userId);
    
    logger.info('[aiRoutes] Created beautify job', { jobId, userId, options });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Beautification job created',
      creditsRemaining: balance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/social/export
 * Export for social sharing with optimized formats
 * 
 * Body: { imageKey, platform: 'instagram' | 'tiktok' | 'facebook', format: 'image' | 'video', options }
 * Response: { jobId, status }
 */
router.post('/social/export', authenticate, async (req, res, next) => {
  try {
    const { imageKey, platform = 'instagram', format = 'image', options = {} } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    // Social export is free
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'social_export', 'queued', JSON.stringify({ platform, format, options }), imageKey]
    );
    
    await enqueueJob('social_export', {
      type: 'social_export',
      payload: {
        userId,
        imageKey,
        platform,
        format,
        options,
      },
    }, {
      jobId,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { count: 100 },
    });
    
    logger.info('[aiRoutes] Created social export job', { jobId, userId, platform, format });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Social export job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/video/generate
 * Generate video from images for social clips
 * 
 * Body: { imageKeys, options: { fps, duration, transition, platform } }
 * Response: { jobId, status }
 */
router.post('/video/generate', authenticate, async (req, res, next) => {
  try {
    const { imageKeys, options = {} } = req.body;
    const userId = req.user.id;
    
    if (!imageKeys || imageKeys.length < 2) {
      return res.status(400).json({ error: 'At least 2 imageKeys are required' });
    }
    
    // Check credits
    const creditCheck = await creditService.hasCredits(userId, 'video_generate');
    if (!creditCheck.allowed) {
      const packages = pricingService.getCreditPackages();
      const plans = pricingService.getPlans();
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditCheck.cost,
        remaining: creditCheck.remaining,
        message: 'Please purchase credits or upgrade your plan to continue.',
        packages,
        plans: plans.filter(p => p.price > 0)
      });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'video_generate', 'queued', JSON.stringify(options), imageKeys[0]]
    );
    
    await enqueueJob('video_generate', {
      type: 'video_generate',
      payload: {
        userId,
        imageKeys,
        options,
      },
    }, {
      jobId,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { count: 100 },
    });
    
    await creditService.deductCredits(userId, 'video_generate', jobId, options);
    
    const { balance } = await creditService.getUserCredits(userId);
    
    logger.info('[aiRoutes] Created video generate job', { jobId, userId, imageCount: imageKeys.length });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Video generation job created',
      creditsRemaining: balance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/avatar/create
 * Create avatar with specific style
 * 
 * Body: { imageKey, style: 'cartoon' | 'realistic' | 'stylized' | 'anime' }
 * Response: { jobId, status }
 */
router.post('/avatar/create', authenticate, async (req, res, next) => {
  try {
    const { imageKey, avatarStyle } = req.body;
    const userId = req.user.id;
    
    if (!imageKey) {
      return res.status(400).json({ error: 'imageKey is required' });
    }
    
    const jobId = uuidv4();
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [jobId, userId, 'avatar_creation', 'queued', JSON.stringify({ avatarStyle }), imageKey]
    );
    
    await enqueueJob('avatar_creation', {
      type: 'avatar_creation',
      payload: {
        userId,
        imageKey,
        avatarStyle,
      },
    }, { jobId });
    
    logger.info('[aiRoutes] Created avatar job', { jobId, userId, avatarStyle });
    
    res.status(201).json({
      jobId,
      status: 'queued',
      message: 'Avatar creation job created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/job/:id
 * Get job status and result
 * 
 * Response: { id, type, status, resultUrl, signedUrl, metadata, errorMessage }
 */
router.get('/job/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT id, user_id, type, status, result_key, result_url, signed_url, metadata, error_message, created_at, completed_at
       FROM gen_jobs 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.rows[0];
    
    let resultUrl = job.result_url;
    let signedUrl = job.signed_url;
    
    // Generate fresh signed URL if result exists
    if (job.result_key && !signedUrl) {
      signedUrl = await storage.getSignedUrlForKey(job.result_key, 3600);
      resultUrl = storage.getPublicUrlForKey(job.result_key);
    }
    
    res.json({
      id: job.id,
      type: job.type,
      status: job.status,
      resultUrl,
      signedUrl,
      metadata: job.metadata ? JSON.parse(job.metadata) : null,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/jobs
 * List user's jobs
 * 
 * Query: { status, type, limit, offset }
 * Response: { jobs: [], total }
 */
router.get('/jobs', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, type, limit = 20, offset = 0 } = req.query;
    
    let query = `SELECT id, user_id, type, status, result_key, result_url, metadata, created_at, completed_at
                 FROM gen_jobs 
                 WHERE user_id = $1`;
    const params = [userId];
    
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM gen_jobs WHERE user_id = $1`;
    const countParams = [userId];
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    const countResult = await db.query(countQuery, countParams);
    
    const jobs = result.rows.map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      resultUrl: job.result_url,
      metadata: job.metadata ? JSON.parse(job.metadata) : null,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    }));
    
    res.json({
      jobs,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
