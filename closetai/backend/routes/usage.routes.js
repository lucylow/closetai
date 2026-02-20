/**
 * Usage API: report usage, check quotas.
 * Supports JWT auth (req.user) or demo mode (userId in body/query).
 */
const express = require('express');
const router = express.Router();
const usageService = require('../services/usageService');
const rateLimiter = require('../lib/rateLimiter');
const { optionalAuthenticate } = require('../middleware/auth.middleware');

function resolveUserId(req) {
  return req.user?.id || req.body.userId || req.query.userId;
}

/**
 * POST /api/usage/report
 * body: { userId?, metric, value? }
 */
router.post('/report', optionalAuthenticate, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { metric, value } = req.body;
    if (!userId || !metric) {
      return res.status(400).json({ error: 'userId and metric required (or use JWT)' });
    }

    const rl = await rateLimiter.tokenBucket(`usage:${userId}`, 600, 60);
    if (rl.remaining <= 0) {
      return res.status(429).json({ error: 'rate_limit_exceeded' });
    }

    const result = await usageService.reportUsage({
      userId,
      metric,
      value: value ?? 1,
      reportedBy: 'api',
    });
    res.json({ ok: true, allowed: result.allowed });
  } catch (err) {
    if (err.message === 'quota_exceeded') {
      return res.status(402).json({ error: 'quota_exceeded' });
    }
    console.error('usage/report error', err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * GET /api/usage/check?userId=...&metric=...
 */
router.get('/check', optionalAuthenticate, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { metric } = req.query;
    if (!userId || !metric) {
      return res.status(400).json({ error: 'userId and metric required (or use JWT)' });
    }

    const info = await usageService.getUsageForUser(userId, metric);
    res.json({
      ok: true,
      data: {
        total: info.total,
        limit: info.limit,
        remaining: info.remaining,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
