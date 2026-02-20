/**
 * Tenant Middleware - Resolve tenant from Host header or JWT
 */

const db = require('./db');

/**
 * Resolve tenant from request
 * Checks Host header for domain mapping, then falls back to JWT
 */
async function resolveTenant(req, res, next) {
  const host = req.headers.host;
  
  // Try domain mapping first
  if (host) {
    try {
      const r = await db.query(
        'SELECT tenant_id FROM tenant_domains WHERE domain = $1 LIMIT 1',
        [host]
      );
      if (r.rows[0]) {
        req.tenantId = r.rows[0].tenant_id;
        return next();
      }
    } catch (err) {
      // Continue to JWT fallback
    }
  }
  
  // Fallback: resolve from JWT
  if (req.user && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }
  
  // Check for tenant_id in query or body (for API clients)
  if (req.query.tenant_id) {
    req.tenantId = req.query.tenant_id;
    return next();
  }
  
  return res.status(400).json({ error: 'Tenant resolution failed' });
}

/**
 * Require tenant context - must be called after resolveTenant
 */
function requireTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
}

/**
 * Get tenant settings from database
 */
async function getTenantSettings(tenantId) {
  const result = await db.query(
    'SELECT * FROM tenant_settings WHERE tenant_id = $1',
    [tenantId]
  );
  return result.rows[0] || null;
}

/**
 * Get brand/tenant info
 */
async function getTenant(tenantId) {
  const result = await db.query(
    'SELECT * FROM brands WHERE id = $1',
    [tenantId]
  );
  return result.rows[0] || null;
}

module.exports = {
  resolveTenant,
  requireTenant,
  getTenantSettings,
  getTenant
};
