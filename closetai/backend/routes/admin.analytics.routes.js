/**
 * Admin Analytics Routes
 * 
 * Comprehensive usage monitoring and analytics
 * Protected by ADMIN_TOKEN
 */
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getQueueCounts, getJobStatus } = require('../lib/queue');
const yceClient = require('../lib/yceClient');
const creditService = require('../services/creditService');

// Middleware to check admin token
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (adminToken && token !== adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/**
 * GET /admin/analytics/overview
 * System-wide analytics overview
 */
router.get('/analytics/overview', requireAdmin, async (req, res) => {
  try {
    // Get job statistics
    const jobStats = await db.query(
      `SELECT 
         type,
         status,
         COUNT(*) as count
       FROM gen_jobs 
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY type, status`
    );
    
    // Get usage statistics
    const usageStats = await db.query(
      `SELECT 
         event_type,
         COUNT(*) as count,
         SUM(credits) as total_credits
       FROM usage_events
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY event_type`
    );
    
    // Get user counts by tier
    const userTiers = await db.query(
      `SELECT 
         tier,
         COUNT(*) as count
       FROM subscriptions
       WHERE status = 'active'
       GROUP BY tier`
    );
    
    // Get queue counts
    const queueCounts = await getQueueCounts();
    
    // Get YCE rate limit status
    const rateLimitStatus = yceClient.getRateLimitStatus();
    const creditCount = yceClient.getLastCreditCount();
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      jobs: {
        byTypeAndStatus: jobStats.rows,
        queue: queueCounts,
      },
      usage: {
        byEventType: usageStats.rows,
      },
      users: {
        byTier: userTiers.rows,
      },
      perfectCorp: {
        creditsRemaining: creditCount,
        rateLimit: rateLimitStatus,
      },
    });
  } catch (error) {
    console.error('Admin analytics overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/analytics/trends
 * Usage trends over time
 */
router.get('/analytics/trends', requireAdmin, async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    let interval;
    switch (period) {
      case '24hours':
        interval = '1 hour';
        break;
      case '30days':
        interval = '1 day';
        break;
      default:
        interval = '6 hours';
    }
    
    const trends = await db.query(
      `SELECT 
         date_trunc('hour', created_at) as period,
         event_type,
         COUNT(*) as count,
         SUM(credits) as credits
       FROM usage_events
       WHERE created_at > NOW() - INTERVAL '1 ' || (
         CASE $1 
           WHEN '24hours' THEN 'day'
           WHEN '7days' THEN 'week'
           WHEN '30days' THEN 'month'
         END
       )
       GROUP BY period, event_type
       ORDER BY period DESC`
    );
    
    res.json({
      ok: true,
      period,
      trends: trends.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/analytics/top-users
 * Top users by usage
 */
router.get('/analytics/top-users', requireAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const topUsers = await db.query(
      `SELECT 
         u.id,
         u.email,
         u.name,
         COUNT(ue.id) as total_requests,
         SUM(ABS(ue.credits)) as total_credits
       FROM users u
       JOIN usage_events ue ON ue.user_id = u.id
       WHERE ue.created_at > NOW() - INTERVAL '30 days'
       GROUP BY u.id, u.email, u.name
       ORDER BY total_credits DESC
       LIMIT $2`,
      [limit]
    );
    
    res.json({
      ok: true,
      topUsers: topUsers.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/analytics/job-latency
 * Job processing latency metrics
 */
router.get('/analytics/job-latency', requireAdmin, async (req, res) => {
  try {
    const latency = await db.query(
      `SELECT 
         type,
         AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds,
         MIN(EXTRACT(EPOCH FROM (completed_at - created_at))) as min_duration_seconds,
         MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_duration_seconds,
         COUNT(*) as total_jobs
       FROM gen_jobs
       WHERE status = 'completed'
         AND completed_at IS NOT NULL
         AND created_at > NOW() - INTERVAL '7 days'
       GROUP BY type`
    );
    
    res.json({
      ok: true,
      latencyByType: latency.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/analytics/error-rate
 * Error rate metrics
 */
router.get('/analytics/error-rate', requireAdmin, async (req, res) => {
  try {
    const errors = await db.query(
      `SELECT 
         type,
         COUNT(*) as error_count,
         error_message
       FROM gen_jobs
       WHERE status = 'failed'
         AND created_at > NOW() - INTERVAL '24 hours'
       GROUP BY type, error_message
       ORDER BY error_count DESC
       LIMIT 20`
    );
    
    const totalJobs = await db.query(
      `SELECT COUNT(*) as total
       FROM gen_jobs
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    
    const totalFailed = await db.query(
      `SELECT COUNT(*) as failed
       FROM gen_jobs
       WHERE status = 'failed'
         AND created_at > NOW() - INTERVAL '24 hours'`
    );
    
    const errorRate = totalJobs.rows[0]?.total > 0
      ? (totalFailed.rows[0]?.failed / totalJobs.rows[0]?.total) * 100
      : 0;
    
    res.json({
      ok: true,
      errorRate: errorRate.toFixed(2) + '%',
      totalJobs: totalJobs.rows[0]?.total || 0,
      totalFailed: totalFailed.rows[0]?.failed || 0,
      errorsByType: errors.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/analytics/popular-styles
 * Most popular styles/effects
 */
router.get('/analytics/popular-styles', requireAdmin, async (req, res) => {
  try {
    const popular = await db.query(
      `SELECT 
         metadata->>'makeupStyle' as makeup_style,
         metadata->>'hairStyle' as hair_style,
         metadata->>'filterName' as filter_name,
         metadata->>'category' as category,
         COUNT(*) as usage_count
       FROM gen_jobs
       WHERE status = 'completed'
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY 
         metadata->>'makeupStyle',
         metadata->>'hairStyle', 
         metadata->>'filterName',
         metadata->>'category'
       ORDER BY usage_count DESC
       LIMIT 20`
    );
    
    res.json({
      ok: true,
      popularStyles: popular.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
