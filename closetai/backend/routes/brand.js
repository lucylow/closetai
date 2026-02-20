/**
 * Brand Routes - Theme and branding management
 */

const express = require('express');
const router = express.Router();
const { getSignedPutUrlForTenant, getSignedGetUrlForTenant } = require('../lib/storage');
const db = require('../lib/db');
const { resolveTenant, requireTenant } = require('../lib/tenantMiddleware');

// Apply tenant resolution to all routes
router.use(resolveTenant);
router.use(requireTenant);

/**
 * POST /api/brand/upload-logo
 * Upload logo for tenant
 */
router.post('/upload-logo', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `assets/logo/${Date.now()}-${filename}`;
    const uploadUrl = getSignedPutUrlForTenant(
      req.tenantId, 
      key, 
      600, 
      contentType || 'image/svg+xml'
    );
    res.json({ key, uploadUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/brand
 * Get brand settings
 */
router.get('/', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT brand FROM tenant_settings WHERE tenant_id = $1',
      [req.tenantId]
    );
    res.json({ brand: r.rows[0]?.brand || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/brand/tokens
 * Update brand tokens
 */
router.put('/tokens', async (req, res) => {
  try {
    const { tokens } = req.body;
    await db.query(
      `INSERT INTO tenant_settings (tenant_id, brand, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET 
         brand = $2, 
         updated_at = NOW()`,
      [req.tenantId, { tokens }]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/brand/domains
 * Get custom domains for tenant
 */
router.get('/domains', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM tenant_domains WHERE tenant_id = $1',
      [req.tenantId]
    );
    res.json({ domains: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/brand/domains
 * Add custom domain
 */
router.post('/domains', async (req, res) => {
  try {
    const { domain } = req.body;
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    
    await db.query(
      `INSERT INTO tenant_domains (tenant_id, domain, verification_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, domain) DO NOTHING`,
      [req.tenantId, domain, verificationToken]
    );
    
    res.json({ 
      ok: true, 
      domain, 
      verificationToken,
      instruction: 'Add TXT record _acme-challenge.' + domain + ' with value ' + verificationToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
