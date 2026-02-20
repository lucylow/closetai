/**
 * Auth Middleware - Multi-tenancy and Feature Gating
 * Handles JWT authentication, brand isolation, and subscription tier checks
 */
const authService = require('../services/auth.service');
const db = require('../lib/db');
const env = require('../config/env');

/**
 * Main authentication middleware - verifies JWT token and loads user/brand context
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Load full user context including brand and subscription
  try {
    const userContext = await loadUserContext(decoded);
    if (!userContext) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = userContext;
    next();
  } catch (error) {
    console.error('[auth] Error loading user context:', error);
    return res.status(500).json({ error: 'Failed to load user context' });
  }
};

/**
 * Optional auth: sets req.user when token is valid, but does not require it
 */
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  if (decoded) {
    try {
      const userContext = await loadUserContext(decoded);
      req.user = userContext;
    } catch (error) {
      // Continue without user context on error
    }
  }
  next();
};

/**
 * Load full user context including brand and subscription info
 */
async function loadUserContext(decoded) {
  const { id } = decoded;
  
  // Get user with brand info
  const userResult = await db.query(
    `SELECT u.*, b.name as brand_name, b.slug as brand_slug, b.tier as brand_tier, b.settings as brand_settings
     FROM users u
     LEFT JOIN brands b ON b.id = u.brand_id
     WHERE u.id = $1`,
    [id]
  );
  
  if (userResult.rows.length === 0) return null;
  
  const user = userResult.rows[0];
  
  // Get subscription details
  const subscription = await getUserSubscription(user.brand_id);
  
  // Get feature flags for the tier
  const features = env.getTier(user.brand_tier || 'free');
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    brandId: user.brand_id,
    brandName: user.brand_name,
    brandSlug: user.brand_slug,
    tier: user.brand_tier || 'free',
    subscription,
    features: features.features,
    credits: subscription?.credits_remaining || 0,
    isEnterprise: user.brand_tier === 'enterprise',
  };
}

/**
 * Get user's subscription details
 */
async function getUserSubscription(brandId) {
  if (!brandId) return null;
  
  const result = await db.query(
    `SELECT s.*, sp.name as plan_name, sp.monthly_credits
     FROM brand_subscriptions s
     JOIN subscription_plans sp ON sp.id = s.plan_id
     WHERE s.brand_id = $1 AND s.status = 'active'
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [brandId]
  );
  
  if (result.rows.length === 0) return null;
  
  const sub = result.rows[0];
  
  // Get remaining credits
  const creditsResult = await db.query(
    `SELECT COALESCE(SUM(credits), 0) as total_credits
     FROM brand_credits
     WHERE brand_id = $1 AND expires_at > NOW()`,
    [brandId]
  );
  
  return {
    id: sub.id,
    planId: sub.plan_id,
    planName: sub.plan_name,
    status: sub.status,
    monthlyCredits: parseInt(sub.monthly_credits),
    creditsRemaining: parseInt(creditsResult.rows[0].total_credits),
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
  };
}

/**
 * Middleware to verify user has access to specific brand
 * Use: verifyBrandAccess('brandId param name')
 */
const verifyBrandAccess = (paramName = 'brandId') => {
  return async (req, res, next) => {
    const requestedBrandId = req.params[paramName] || req.body.brandId;
    
    // Admins can access any brand
    if (req.user.isEnterprise) {
      return next();
    }
    
    // Check if user belongs to the requested brand
    if (req.user.brandId !== requestedBrandId) {
      return res.status(403).json({ error: 'Access denied to this brand' });
    }
    
    next();
  };
};

/**
 * Middleware to verify feature is enabled for user's tier
 * Use: requireFeature('makeupTryOn')
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const isEnabled = req.user.features?.[featureName];
    if (!isEnabled) {
      return res.status(403).json({ 
        error: 'Feature not available',
        upgradeRequired: true,
        feature: featureName,
        tier: req.user.tier,
      });
    }
    
    next();
  };
};

/**
 * Middleware to verify user has sufficient credits
 * Use: requireCredits(1)
 */
const requireCredits = (amount = 1) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Enterprise users have unlimited credits
    if (req.user.isEnterprise) {
      return next();
    }
    
    const userCredits = req.user.credits || 0;
    if (userCredits < amount) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: amount,
        available: userCredits,
        upgradeRequired: true,
      });
    }
    
    next();
  };
};

/**
 * Middleware to deduct credits after successful operation
 * Use: deductCredits(1)
 */
const deductCredits = (amount = 1) => {
  return async (req, res, next) => {
    // Skip for enterprise users
    if (req.user.isEnterprise) {
      return next();
    }
    
    try {
      await db.query(
        `INSERT INTO brand_credits (brand_id, credits, description, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
        [req.user.brandId, -amount, 'Credit deduction for API call']
      );
    } catch (error) {
      console.error('[auth] Failed to deduct credits:', error);
    }
    
    next();
  };
};

module.exports = { 
  authenticate, 
  optionalAuthenticate,
  verifyBrandAccess,
  requireFeature,
  requireCredits,
  deductCredits,
};
