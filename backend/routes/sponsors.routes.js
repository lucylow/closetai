const express = require('express');
const router = express.Router();

/**
 * GET /api/kilo/stats
 * Development stats for "Built with Kilo Code" badge (mock)
 */
router.get('/kilo/stats', (req, res) => {
  res.json({
    prompts: 47,
    linesOfCode: 15200,
    commits: 34,
    timeSaved: '12 hours',
  });
});

/**
 * GET /api/akamai/info
 * Deployment info for Akamai/Linode (mock)
 */
router.get('/akamai/info', (req, res) => {
  res.json({
    region: 'US-Seattle',
    gpu: 'NVIDIA RTX 4000 Ada',
    gpuCount: 2,
    uptime: '99.9%',
    creditsUsed: 234.5,
  });
});

module.exports = router;
