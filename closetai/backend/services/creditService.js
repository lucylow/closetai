/**
 * Credit Tracking Service
 * 
 * Tracks API usage per user/tenant and enforces quotas
 * Integrates with Stripe for billing
 */
const db = require('../lib/db');
const { enqueueStripeUsageReport } = require('../lib/queue');

const CREDIT_COSTS = {
  makeup_tryon: 1,
  skin_analysis: 2,
  hair_style: 1,
  fashion_tryon: 2,
  accessory_tryon: 1,
  creative_lookbook: 3,
  fun_filter: 0.5,
  avatar_creation: 2,
  vton: 2,
  generate: 2,
  measure: 1,
  // B2C Consumer Features
  self_edit: 1,        // Auto crop, background remove, auto-enhance
  beautify: 2,          // Face filters, skin tuning
  avatar_create: 3,     // Avatar creation with style
  video_generate: 4,    // Video generation from images
  social_export: 0,     // Social sharing export (free)
};

/**
 * Get user's current credit balance and usage
 */
async function getUserCredits(userId) {
  const result = await db.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN event_type LIKE 'credit:%' THEN credits ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN event_type NOT LIKE 'credit:%' THEN credits ELSE 0 END), 0) as balance
     FROM usage_events 
     WHERE user_id = $1 
       AND created_at > date_trunc('month', now())`,
    [userId]
  );
  
  return {
    balance: result.rows[0]?.balance || 0,
  };
}

/**
 * Check if user has enough credits for an operation
 */
async function hasCredits(userId, operationType, quantity = 1) {
  const cost = CREDIT_COSTS[operationType] || 1;
  const required = cost * quantity;
  
  const credits = await getUserCredits(userId);
  
  // Enterprise users have unlimited credits
  const userTier = await getUserTier(userId);
  if (userTier === 'enterprise') {
    return { allowed: true, remaining: Infinity, cost: required };
  }
  
  return {
    allowed: credits.balance >= required,
    remaining: credits.balance,
    cost: required,
  };
}

/**
 * Get user's subscription tier
 */
async function getUserTier(userId) {
  try {
    const result = await db.query(
      `SELECT tier 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.tier || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Deduct credits for an operation
 * Creates usage event and optionally reports to Stripe
 */
async function deductCredits(userId, operationType, jobId = null, metadata = {}) {
  const cost = CREDIT_COSTS[operationType] || 1;
  
  // Insert usage event
  await db.query(
    `INSERT INTO usage_events (user_id, event_type, credits, metadata, job_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, `api:${operationType}`, cost, JSON.stringify(metadata), jobId]
  );
  
  // Check if we should report to Stripe (for metered billing)
  const userTier = await getUserTier(userId);
  if (userTier !== 'enterprise') {
    await enqueueStripeUsageReport({
      subscriptionItemId: null,
      quantity: cost,
    });
  }
  
  return { deducted: cost, operationType, jobId };
}

/**
 * Add credits to user account (purchase or bonus)
 */
async function addCredits(userId, amount, source = 'purchase', metadata = {}) {
  await db.query(
    `INSERT INTO usage_events (user_id, event_type, credits, metadata, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, `credit:${source}`, amount, JSON.stringify(metadata)]
  );
  
  return { added: amount, source };
}

/**
 * Get usage statistics for a user
 */
async function getUserUsageStats(userId, periodDays = 30) {
  const result = await db.query(
    `SELECT 
       event_type,
       COUNT(*) as count,
       SUM(credits) as total_credits
     FROM usage_events 
     WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 day' * $2
       AND event_type NOT LIKE 'credit:%'
     GROUP BY event_type
     ORDER BY total_credits DESC`,
    [userId, periodDays]
  );
  
  return result.rows;
}

/**
 * Get credit cost for an operation type
 */
function getCreditCost(operationType) {
  return CREDIT_COSTS[operationType] || 1;
}

module.exports = {
  CREDIT_COSTS,
  getUserCredits,
  hasCredits,
  getUserTier,
  deductCredits,
  addCredits,
  getUserUsageStats,
  getCreditCost,
};
