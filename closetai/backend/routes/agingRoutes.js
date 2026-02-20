/**
 * Aging Routes - API endpoints for AI Aging features
 * Provides endpoints for skin analysis, aging simulation, and diagnostic reports
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const agingStorage = require('../lib/agingStorage');
const agingQueue = require('../lib/agingQueue');

// Environment config
const MINOR_AGE_CUTOFF = Number(process.env.MINOR_AGE_CUTOFF) || 13;
const PARENTAL_CONSENT_REQUIRED = process.env.PARENTAL_CONSENT_REQUIRED === 'true';

/**
 * POST /api/aging/upload-url
 * Get signed URL for uploading face image
 */
router.post('/upload-url', async (req, res) => {
  try {
    const { userId, filename, contentType = 'image/jpeg' } = req.body;
    
    if (!userId || !filename) {
      return res.status(400).json({ error: 'userId and filename are required' });
    }
    
    const { uploadUrl, key } = await agingStorage.getSignedPutUrl(
      userId, 
      filename, 
      600, 
      contentType
    );
    
    res.json({ uploadUrl, key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * POST /api/aging/consent
 * Record user consent for data processing
 */
router.post('/consent', async (req, res) => {
  try {
    const { userId, jobId, consentType, consentText, parentalConsent, parentalEmail } = req.body;
    
    if (!userId || !consentType || !consentText) {
      return res.status(400).json({ error: 'userId, consentType, and consentText are required' });
    }
    
    // Check if user is a minor
    const userResult = await db.getPool().query(
      'SELECT date_of_birth, parental_consent_given FROM users WHERE id = $1',
      [userId]
    );
    
    let isMinor = false;
    if (userResult.rows[0]?.date_of_birth) {
      const dob = new Date(userResult.rows[0].date_of_birth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isMinor = age < MINOR_AGE_CUTOFF;
    }
    
    // Enforce parental consent for minors
    if (isMinor && PARENTAL_CONSENT_REQUIRED && !parentalConsent) {
      return res.status(400).json({ 
        error: 'Parental consent required for users under ' + MINOR_AGE_CUTOFF,
        requiresParentalConsent: true
      });
    }
    
    // Record consent
    const consentId = uuidv4();
    await db.getPool().query(
      `INSERT INTO consent_records (id, user_id, job_id, consent_type, consent_text, consent_version, parental_consent, parental_consenter_email, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        consentId, 
        userId, 
        jobId || null, 
        consentType, 
        consentText, 
        '1.0', 
        parentalConsent || false, 
        parentalEmail || null,
        req.ip,
        req.get('User-Agent')
      ]
    );
    
    // Update user record if parental consent given
    if (parentalConsent && parentalEmail) {
      await db.getPool().query(
        'UPDATE users SET parental_consent_given = true, parental_consent_email = $1 WHERE id = $2',
        [parentalEmail, userId]
      );
    }
    
    res.json({ success: true, consentId });
  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

/**
 * POST /api/aging/analyze
 * Enqueue aging analysis job
 */
router.post('/analyze', async (req, res) => {
  try {
    const { userId, tenantId, srcKey, requestedMetrics, consentToken } = req.body;
    
    if (!userId || !srcKey) {
      return res.status(400).json({ error: 'userId and srcKey are required' });
    }
    
    // Verify consent exists
    const consentResult = await db.getPool().query(
      `SELECT id FROM consent_records 
       WHERE user_id = $1 AND consent_type = 'face_analysis' 
       ORDER BY timestamp DESC LIMIT 1`,
      [userId]
    );
    
    if (consentResult.rows.length === 0) {
      return res.status(400).json({ error: 'Consent required before analysis', requiresConsent: true });
    }
    
    // Create aging job record
    const jobId = uuidv4();
    await db.getPool().query(
      `INSERT INTO aging_jobs (id, user_id, tenant_id, type, status, params, created_at, updated_at)
       VALUES ($1, $2, $3, 'aging_analysis', 'pending', $4, NOW(), NOW())`,
      [jobId, userId, tenantId || null, JSON.stringify({ srcKey, requestedMetrics })]
    );
    
    // Enqueue job
    const tier = req.user?.isPremium ? 'hd' : 'low';
    const priority = req.user?.isPremium ? agingQueue.PRIORITY.HIGH : agingQueue.PRIORITY.NORMAL;
    
    await agingQueue.enqueueAgingAnalysis({
      userId,
      jobId,
      srcKey,
      requestedMetrics: requestedMetrics || ['wrinkle', 'pore', 'pigment', 'moisture'],
      tier,
      priority
    });
    
    res.json({ 
      success: true, 
      jobId, 
      status: 'pending',
      estimatedDuration: tier === 'hd' ? '30s' : '60s'
    });
  } catch (error) {
    console.error('Error enqueueing analysis:', error);
    res.status(500).json({ error: 'Failed to enqueue analysis' });
  }
});

/**
 * POST /api/aging/simulate
 * Enqueue aging simulation job
 */
router.post('/simulate', async (req, res) => {
  try {
    const { userId, tenantId, srcKey, yearsDelta, direction, strength } = req.body;
    
    if (!userId || !srcKey || yearsDelta === undefined) {
      return res.status(400).json({ error: 'userId, srcKey, and yearsDelta are required' });
    }
    
    // Validate years delta
    const maxYears = Number(process.env.AGE_SIMULATION_MAX_YEARS) || 20;
    if (Math.abs(yearsDelta) > maxYears) {
      return res.status(400).json({ error: `yearsDelta cannot exceed ${maxYears}` });
    }
    
    // Create aging job record
    const jobId = uuidv4();
    await db.getPool().query(
      `INSERT INTO aging_jobs (id, user_id, tenant_id, type, status, params, created_at, updated_at)
       VALUES ($1, $2, $3, 'aging_simulation', 'pending', $4, NOW(), NOW())`,
      [jobId, userId, tenantId || null, JSON.stringify({ srcKey, yearsDelta, direction, strength })]
    );
    
    // Enqueue job
    const tier = req.user?.isPremium ? 'hd' : 'low';
    await agingQueue.enqueueAgingSimulation({
      userId,
      jobId,
      srcKey,
      yearsDelta,
      direction: direction || (yearsDelta > 0 ? 'older' : 'younger'),
      strength: strength || 0.8,
      tier
    });
    
    res.json({ 
      success: true, 
      jobId, 
      status: 'pending',
      warning: 'This is an illustrative simulation for educational purposes only.'
    });
  } catch (error) {
    console.error('Error enqueueing simulation:', error);
    res.status(500).json({ error: 'Failed to enqueue simulation' });
  }
});

/**
 * GET /api/aging/job/:id
 * Get job status and results
 */
router.get('/job/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.getPool().query(
      `SELECT * FROM aging_jobs WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.rows[0];
    
    // Get result URLs if completed
    let resultUrls = null;
    if (job.status === 'completed' && job.result_keys) {
      const keys = job.result_keys;
      resultUrls = {};
      
      if (keys.reportId) {
        // Get report data
        const reportResult = await db.getPool().query(
          'SELECT * FROM aging_reports WHERE id = $1',
          [keys.reportId]
        );
        if (reportResult.rows.length > 0) {
          const report = reportResult.rows[0];
          resultUrls.report = {
            metrics: {
              wrinkle_index: report.wrinkle_index,
              pore_index: report.pore_index,
              pigment_index: report.pigment_index,
              hydration_index: report.hydration_index,
              elasticity_proxy: report.elasticity_proxy,
              uv_damage_score: report.uv_damage_score,
              estimated_appearance_age: report.estimated_appearance_age,
              confidence_lower: report.confidence_lower,
              confidence_upper: report.confidence_upper
            },
            recommendations: report.recommendations
          };
          
          // Generate signed URLs for overlays
          if (report.overlay_urls) {
            resultUrls.overlays = {};
            for (const [metric, key] of Object.entries(report.overlay_urls)) {
              resultUrls.overlays[metric] = agingStorage.getSignedGetUrl(key);
            }
          }
        }
      }
      
      if (keys.resultKey) {
        resultUrls.simulation = {
          image: agingStorage.getSignedGetUrl(keys.resultKey),
          thumbnail: keys.thumbnailKey ? agingStorage.getSignedGetUrl(keys.thumbnailKey) : null
        };
      }
    }
    
    res.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.metadata?.progress,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      error: job.error_message,
      creditsConsumed: job.credits_consumed,
      results: resultUrls
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

/**
 * POST /api/aging/feedback
 * Submit feedback on aging results
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, jobId, rating, comment, liked } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'userId and jobId are required' });
    }
    
    const feedbackId = uuidv4();
    await db.getPool().query(
      `INSERT INTO aging_feedback (id, user_id, job_id, rating, comment, liked, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [feedbackId, userId, jobId, rating || null, comment || null, liked || null]
    );
    
    res.json({ success: true, feedbackId });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

/**
 * DELETE /api/aging/user/:userId/data
 * Delete all aging data for a user (GDPR deletion request)
 */
router.delete('/user/:userId/data', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete aging records
    await db.getPool().query('DELETE FROM aging_reports WHERE user_id = $1', [userId]);
    await db.getPool().query('DELETE FROM aging_simulations WHERE user_id = $1', [userId]);
    await db.getPool().query('DELETE FROM aging_feedback WHERE user_id = $1', [userId]);
    await db.getPool().query('DELETE FROM consent_records WHERE user_id = $1', [userId]);
    await db.getPool().query('DELETE FROM aging_jobs WHERE user_id = $1', [userId]);
    await db.getPool().query('DELETE FROM aging_credits_usage WHERE user_id = $1', [userId]);
    
    // Note: Actual S3 deletion would be handled by a background job
    // For now, we just mark records as deleted
    
    res.json({ success: true, message: 'All aging data deleted for user' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

/**
 * GET /api/aging/reports/:userId
 * Get aging reports for a user
 */
router.get('/reports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await db.getPool().query(
      `SELECT id, wrinkle_index, pore_index, pigment_index, hydration_index, 
              elasticity_proxy, uv_damage_score, estimated_appearance_age, 
              confidence_lower, confidence_upper, created_at
       FROM aging_reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

module.exports = router;
