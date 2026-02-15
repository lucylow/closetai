/**
 * Usage API: report usage, check quotas.
 */
const express = require('express');
const router = express.Router();
const usageService = require('../services/usageService');
const rateLimiter = require('../lib/rateLimiter');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * POST /api/usage/report
 * body: { metric, value? }
 * userId from JWT (authenticated)
 */
router.post('/report', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { metric, value } = req.body;
    if (!metric)
      return res.status(400).json({ error: 'metric required' });

    const rl = await rateLimiter.tokenBucket(`usage:${userId}`, 600, 60);
    if (rl.remaining <= 0)
      return res.status(429).json({ error: 'rate_limit_exceeded' });

    const result = await usageService.reportUsage({
      userId,
      metric,
      value: value ?? 1,
      reportedBy: 'api',
    });
    res.json({ ok: true, allowed: result.allowed });
  } catch (err) {
    if (err.message === 'quota_exceeded')
      return res.status(402).json({ error: 'quota_exceeded' });
    console.error('usage/report error', err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * GET /api/usage/check?metric=...
 * userId from JWT
 */
router.get('/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { metric } = req.query;
    if (!metric)
      return res.status(400).json({ error: 'metric required' });

    const info = await usageService.getUsageForUser(userId, metric);
    res.json({ ok: true, data: info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
