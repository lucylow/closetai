const express = require('express');
const router = express.Router();

// Kilo stats moved to /api/kilo/stats (kilo.routes.js)

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
