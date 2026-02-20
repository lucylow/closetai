/**
 * Generation Controller - Handles async generative AI job requests
 * Routes: POST /text2img, POST /edit, POST /tryon, POST /batch, GET /job/:id
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const storage = require('../lib/storage');
const { enqueueJob } = require('../lib/queue');
const perfectService = require('../services/perfectCorp.service');

/**
 * Create a text-to-image generation job
 */
async function createText2Img(req, res) {
  const userId = req.user?.id;
  const { 
    prompt, 
    style = 'photorealistic', 
    width = 1024, 
    height = 1024, 
    seed,
    negativePrompt,
    template
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    const jobId = uuidv4();
    
    // Create job record in DB
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, prompt, metadata, style, width, height, seed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [jobId, userId, 'text2img', 'queued', prompt, JSON.stringify({ negativePrompt, template }), style, width, height, seed]
    );
    
    // Enqueue job for async processing
    await enqueueJob('text2img', {
      type: 'text2img',
      payload: { prompt, style, width, height, seed, negativePrompt, template, userId },
    });
    
    // Save prompt for audit
    await db.query(
      `INSERT INTO prompts (id, user_id, prompt, negative_prompt, template, style)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, prompt, negativePrompt, template, style]
    );
    
    res.status(201).json({
      ok: true,
      jobId,
      status: 'queued',
      message: 'Generation job created successfully'
    });
  } catch (error) {
    console.error('[genController] text2img error:', error);
    res.status(500).json({ error: 'Failed to create generation job' });
  }
}

/**
 * Create an image edit job
 */
async function createImageEdit(req, res) {
  const userId = req.user?.id;
  const { 
    imageKey, // S3 key of the image to edit
    prompt, 
    maskKey, // Optional mask for inpainting
    style,
    options = {}
  } = req.body;
  
  if (!imageKey || !prompt) {
    return res.status(400).json({ error: 'Image key and prompt are required' });
  }
  
  try {
    const jobId = uuidv4();
    
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, prompt, metadata, input_key, style)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [jobId, userId, 'edit', 'queued', prompt, JSON.stringify(options), imageKey, style]
    );
    
    await enqueueJob('edit', {
      type: 'edit',
      payload: { imageKey, prompt, maskKey, userId, options: { style, ...options } },
    });
    
    res.status(201).json({
      ok: true,
      jobId,
      status: 'queued'
    });
  } catch (error) {
    console.error('[genController] image-edit error:', error);
    res.status(500).json({ error: 'Failed to create edit job' });
  }
}

/**
 * Create a virtual try-on job
 */
async function createTryon(req, res) {
  const userId = req.user?.id;
  const { 
    personImageKey, // S3 key of person photo
    itemImageKey,  // S3 key of garment image
    category = 'top',
    fit = 'standard',
    options = {}
  } = req.body;
  
  if (!personImageKey || !itemImageKey) {
    return res.status(400).json({ error: 'Person image and item image keys are required' });
  }
  
  try {
    const jobId = uuidv4();
    
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata, input_key, style)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [jobId, userId, 'tryon', 'queued', JSON.stringify({ category, fit, ...options }), personImageKey, category]
    );
    
    await enqueueJob('tryon', {
      type: 'tryon',
      payload: { personImageKey, itemImageKey, category, fit, userId, options },
    });
    
    res.status(201).json({
      ok: true,
      jobId,
      status: 'queued'
    });
  } catch (error) {
    console.error('[genController] tryon error:', error);
    res.status(500).json({ error: 'Failed to create tryon job' });
  }
}

/**
 * Create a batch generation job
 */
async function createBatch(req, res) {
  const userId = req.user?.id;
  const { 
    jobs, // Array of { prompt, style, ... }
    template
  } = req.body;
  
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ error: 'Jobs array is required' });
  }
  
  if (jobs.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 jobs per batch' });
  }
  
  try {
    const jobId = uuidv4();
    
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, type, status, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [jobId, userId, 'batch', 'queued', JSON.stringify({ template, jobCount: jobs.length })]
    );
    
    await enqueueJob('batch', {
      type: 'batch',
      payload: { jobs, userId, template },
    });
    
    res.status(201).json({
      ok: true,
      jobId,
      status: 'queued',
      jobCount: jobs.length
    });
  } catch (error) {
    console.error('[genController] batch error:', error);
    res.status(500).json({ error: 'Failed to create batch job' });
  }
}

/**
 * Get job status and result
 */
async function getJobStatus(req, res) {
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    const result = await db.query(
      `SELECT id, user_id, type, status, prompt, metadata, result_key, input_key, style, width, height, 
              credits_used, error_message, created_at, updated_at, completed_at
       FROM gen_jobs 
       WHERE id = $1 AND (user_id = $2 OR $3 = 'true')
       LIMIT 1`,
      [id, userId, req.isAdmin ? 'true' : 'false']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.rows[0];
    
    // Generate signed URL if job is completed
    let resultUrl = null;
    if (job.result_key && job.status === 'completed') {
      resultUrl = await storage.getSignedUrlForKey(job.result_key, 3600); // 1 hour expiry
    }
    
    res.json({
      id: job.id,
      type: job.type,
      status: job.status,
      prompt: job.prompt,
      metadata: job.metadata,
      resultUrl,
      inputKey: job.input_key,
      style: job.style,
      width: job.width,
      height: job.height,
      creditsUsed: job.credits_used,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at
    });
  } catch (error) {
    console.error('[genController] getJobStatus error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
}

/**
 * Get user's generation jobs
 */
async function listJobs(req, res) {
  const userId = req.user?.id;
  const { status, type, limit = 20, offset = 0 } = req.query;
  
  try {
    let query = `
      SELECT id, user_id, type, status, prompt, metadata, result_key, style, 
             created_at, updated_at, completed_at
      FROM gen_jobs 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    params.push(parseInt(limit), parseInt(offset));
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM gen_jobs WHERE user_id = $1`;
    const countParams = [userId];
    if (status) {
      countParams.push(status);
      countQuery += ` AND status = $${countParams.length}`;
    }
    if (type) {
      countParams.push(type);
      countQuery += ` AND type = $${countParams.length}`;
    }
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      jobs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[genController] listJobs error:', error);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
}

/**
 * Get signed URL for direct image upload
 */
async function getUploadUrl(req, res) {
  const userId = req.user?.id;
  const { filename, contentType = 'image/jpeg', folder = 'uploads' } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }
  
  try {
    const key = `${folder}/${userId}/${Date.now()}-${filename}`;
    const signedUrl = await storage.getSignedUrlForKey(key, 600); // 10 min expiry
    
    res.json({
      key,
      uploadUrl: signedUrl,
      expiresIn: 600
    });
  } catch (error) {
    console.error('[genController] getUploadUrl error:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
}

/**
 * Get signed URL for image download
 */
async function getDownloadUrl(req, res) {
  const { key } = req.params;
  const { expires = 3600 } = req.query;
  
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
  
  try {
    const signedUrl = await storage.getSignedUrlForKey(key, parseInt(expires));
    res.json({ url: signedUrl, expiresIn: parseInt(expires) });
  } catch (error) {
    console.error('[genController] getDownloadUrl error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
}

/**
 * Delete a job and its result
 */
async function deleteJob(req, res) {
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    // Get job to check ownership
    const jobResult = await db.query(
      `SELECT result_key FROM gen_jobs WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Delete S3 object if exists
    if (jobResult.rows[0].result_key) {
      try {
        await storage.deleteObject(jobResult.rows[0].result_key);
      } catch (s3Error) {
        console.warn('[genController] Failed to delete S3 object:', s3Error.message);
      }
    }
    
    // Delete from DB (cascades to api_usage)
    await db.query(`DELETE FROM gen_jobs WHERE id = $1`, [id]);
    
    res.json({ ok: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('[genController] deleteJob error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
}

/**
 * Save a prompt template
 */
async function savePrompt(req, res) {
  const userId = req.user?.id;
  const { prompt, negativePrompt, template, style, isPublic = false } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    const id = uuidv4();
    await db.query(
      `INSERT INTO prompts (id, user_id, prompt, negative_prompt, template, style, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, prompt, negativePrompt, template, style, isPublic]
    );
    
    res.status(201).json({ ok: true, id, message: 'Prompt saved successfully' });
  } catch (error) {
    console.error('[genController] savePrompt error:', error);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
}

/**
 * Get user's saved prompts
 */
async function listPrompts(req, res) {
  const userId = req.user?.id;
  const { template, limit = 20, offset = 0 } = req.query;
  
  try {
    let query = `
      SELECT id, prompt, negative_prompt, template, style, is_public, usage_count, created_at
      FROM prompts 
      WHERE user_id = $1 OR is_public = true
    `;
    const params = [userId];
    
    if (template) {
      params.push(template);
      query += ` AND template = $${params.length}`;
    }
    
    params.push(parseInt(limit), parseInt(offset));
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({ prompts: result.rows });
  } catch (error) {
    console.error('[genController] listPrompts error:', error);
    res.status(500).json({ error: 'Failed to list prompts' });
  }
}

module.exports = {
  createText2Img,
  createImageEdit,
  createTryon,
  createBatch,
  getJobStatus,
  listJobs,
  getUploadUrl,
  getDownloadUrl,
  deleteJob,
  savePrompt,
  listPrompts
};
