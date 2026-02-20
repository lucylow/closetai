/**
 * Pricing Service
 * 
 * Manages subscription plans, credit packages, and Stripe integration
 */
const db = require('../lib/db');
const env = require('../config/env');

// Subscription plans configuration
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 10,
    creditsPeriod: 'month',
    features: ['makeup_tryon', 'fun_filter', 'self_edit', 'social_export'],
    limits: { jobsPerDay: 5, maxImageSize: 5 * 1024 * 1024 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    credits: 100,
    creditsPeriod: 'month',
    features: ['makeup_tryon', 'skin_analysis', 'hair_style', 'fashion_tryon', 'accessory_tryon', 'fun_filter', 'avatar_create', 'self_edit', 'beautify', 'social_export'],
    limits: { jobsPerDay: 50, maxImageSize: 10 * 1024 * 1024 },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    credits: 500,
    creditsPeriod: 'month',
    features: ['makeup_tryon', 'skin_analysis', 'hair_style', 'fashion_tryon', 'accessory_tryon', 'fun_filter', 'avatar_create', 'lookbook', 'self_edit', 'beautify', 'video_generate', 'social_export', 'priority_support'],
    limits: { jobsPerDay: 200, maxImageSize: 20 * 1024 * 1024 },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    stripePriceId: null,
    credits: -1,
    creditsPeriod: 'month',
    features: ['all_features', 'priority_support', 'custom_branding', 'api_access', 'webhooks', 'dedicated_queue'],
    limits: { jobsPerDay: -1, maxImageSize: 50 * 1024 * 1024 },
  },
};

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'credits_50', name: '50 Credits', credits: 50, price: 9.99, stripePriceId: process.env.STRIPE_CREDITS_50 },
  { id: 'credits_100', name: '100 Credits', credits: 100, price: 17.99, stripePriceId: process.env.STRIPE_CREDITS_100 },
  { id: 'credits_250', name: '250 Credits', credits: 250, price: 39.99, stripePriceId: process.env.STRIPE_CREDITS_250 },
  { id: 'credits_500', name: '500 Credits', credits: 500, price: 69.99, stripePriceId: process.env.STRIPE_CREDITS_500 },
];

/**
 * Get all available plans
 */
function getPlans() {
  return Object.values(PLANS);
}

/**
 * Get plan by ID
 */
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

/**
 * Get credit packages
 */
function getCreditPackages() {
  return CREDIT_PACKAGES;
}

/**
 * Get user's current plan
 */
async function getUserPlan(userId) {
  try {
    const result = await db.query(
      `SELECT tier, status, current_period_end 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { ...PLANS.free, status: 'inactive' };
    }
    
    const sub = result.rows[0];
    return {
      ...getPlan(sub.tier),
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
    };
  } catch {
    return { ...PLANS.free, status: 'inactive' };
  }
}

/**
 * Check if feature is available for user
 */
async function hasFeature(userId, feature) {
  const plan = await getUserPlan(userId);
  
  // Enterprise has all features
  if (plan.id === 'enterprise') return true;
  
  // Free users have limited features
  if (plan.id === 'free') {
    return plan.features.includes(feature);
  }
  
  return plan.features.includes(feature) || plan.features.includes('all_features');
}

/**
 * Check if user has hit daily limit
 */
async function checkDailyLimit(userId) {
  const plan = await getUserPlan(userId);
  
  if (plan.limits.jobsPerDay === -1) return { allowed: true };
  
  const result = await db.query(
    `SELECT COUNT(*) as count FROM gen_jobs 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  
  const count = parseInt(result.rows[0].count, 10);
  const allowed = count < plan.limits.jobsPerDay;
  
  return {
    allowed,
    used: count,
    limit: plan.limits.jobsPerDay,
    remaining: Math.max(0, plan.limits.jobsPerDay - count),
  };
}

/**
 * Create Stripe checkout session for subscription
 */
async function createSubscriptionCheckout(userId, planId) {
  const plan = getPlan(planId);
  if (!plan.stripePriceId) {
    throw new Error('Plan not available for purchase');
  }
  
  const stripe = require('stripe')(env.stripe?.secretKey);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: await getUserEmail(userId),
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
    metadata: { userId, planId },
  });
  
  return { sessionId: session.id, url: session.url };
}

/**
 * Create Stripe checkout session for credit package
 */
async function createCreditCheckout(userId, packageId) {
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg || !pkg.stripePriceId) {
    throw new Error('Credit package not available');
  }
  
  const stripe = require('stripe')(env.stripe?.secretKey);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: await getUserEmail(userId),
    line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
    payment_intent_data: { metadata: { userId, packageId, credits: pkg.credits } },
    success_url: `${process.env.FRONTEND_URL}/billing/credits-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
  });
  
  return { sessionId: session.id, url: session.url };
}

/**
 * Get user email
 */
async function getUserEmail(userId) {
  const result = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.email;
}

module.exports = {
  PLANS,
  CREDIT_PACKAGES,
  getPlans,
  getPlan,
  getCreditPackages,
  getUserPlan,
  hasFeature,
  checkDailyLimit,
  createSubscriptionCheckout,
  createCreditCheckout,
};
