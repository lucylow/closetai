/**
 * Gen Routes - Tenant-aware generation endpoints
 * 
 * Provides API endpoints for:
 * - Upload URL generation (tenant + user scoped)
 * - Cost estimation
 * - Job creation and status
 */

const express = require('express');
const router = express.Router();
const { resolveTenant, requireTenant } = require('../lib/tenantMiddleware');
const storage = require('../lib/storage');
const { addJob, getJobStatus } = require('../lib/queue');
const db = require('../lib/db');
const credits = require('../lib/credits');

// Apply tenant resolution to all routes
router.use(resolveTenant);
router.use(requireTenant);

/**
 * POST /api/gen/upload-url
 * Get pre-signed URL for direct upload to S3
 */
router.post('/upload-url', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = (req.user && req.user.id) || null;
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename required' });
    }

    // Generate key based on tenant and user scope
    let key;
    if (userId) {
      key = storage.userKey(userId, `uploads/${Date.now()}-${filename}`);
    } else {
      key = storage.tenantKey(tenantId, `uploads/${Date.now()}-${filename}`);
    }

    const { uploadUrl } = await storage.getSignedPutUrl(
      key,
      600, // 10 minutes
      contentType || 'image/jpeg'
    );

    res.json({ key, uploadUrl });
  } catch (err) {
    console.error('upload-url error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gen/estimate
 * Estimate cost for a job
 */
router.post('/estimate', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { jobType, params } = req.body;

    if (!jobType) {
      return res.status(400).json({ error: 'jobType required' });
    }

    const estimate = credits.estimateCost(jobType, params, tenantId);
    res.json(estimate);
  } catch (err) {
    console.error('estimate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gen/create
 * Create a new generation job
 */
router.post('/create', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = (req.user && req.user.id) || null;
    const { jobType, params } = req.body;

    if (!jobType) {
      return res.status(400).json({ error: 'jobType required' });
    }

    // Estimate cost
    const estimate = credits.estimateCost(jobType, params, tenantId);

    // Check and reserve credits
    const reserved = await credits.reserveCredits(tenantId, userId, estimate.credits);
    if (!reserved) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        required: estimate.credits
      });
    }

    // Create job record
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    await db.query(
      `INSERT INTO gen_jobs (id, user_id, tenant_id, type, status, params, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [jobId, userId, tenantId, jobType, 'queued', JSON.stringify(params)]
    );

    // Add to queue
    await addJob(jobType, { 
      jobId, 
      userId, 
      tenantId, 
      ...params 
    });

    res.json({ 
      jobId, 
      estimatedCost: estimate.credits,
      breakdown: estimate.breakdown
    });
  } catch (err) {
    console.error('create job error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gen/job/:jobId
 * Get job status and results
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const jobId = req.params.jobId;

    const r = await db.query(
      `SELECT id, user_id, type, status, result_keys, metadata, error, created_at, updated_at
       FROM gen_jobs 
       WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId]
    );

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = r.rows[0];
    const keys = job.result_keys || [];
    const results = [];

    // Generate signed URLs for result files
    for (const key of keys) {
      const url = await storage.getSignedGetUrl(key, 3600); // 1 hour
      results.push({ key, url });
    }

    res.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        error: job.error,
        createdAt: job.created_at,
        updatedAt: job.updated_at
      },
      results
    });
  } catch (err) {
    console.error('get job error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gen/jobs
 * List jobs for tenant
 */
router.get('/jobs', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = (req.user && req.user.id) || null;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);

    let query = `
      SELECT id, user_id, type, status, result_keys, error, created_at, updated_at
      FROM gen_jobs 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    // Filter by user if provided
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const r = await db.query(query, params);

    res.json({
      jobs: r.rows.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        error: job.error,
        createdAt: job.created_at,
        hasResults: (job.result_keys || []).length > 0
      })),
      limit,
      offset
    });
  } catch (err) {
    console.error('list jobs error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
