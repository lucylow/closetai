/**
 * Conversion Tracking Service
 * Tracks all conversion events for analytics and attribution
 */
const db = require('../lib/db');
const logger = require('../utils/logger');

/**
 * Event types for conversion tracking
 */
const EVENT_TYPES = {
  TRY_ON_START: 'try_on_start',
  TRY_ON_COMPLETE: 'try_on_complete',
  PRODUCT_VIEW: 'product_view',
  PRODUCT_CLICK: 'product_click',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
  SHARE_SOCIAL: 'share_social',
  LEAD_FORM_VIEW: 'lead_form_view',
  LEAD_FORM_SUBMIT: 'lead_form_submit',
  EMAIL_CAPTURE: 'email_capture',
  CTA_CLICK: 'cta_click',
  RETARGETING_TRIGGER: 'retargeting_trigger',
  AB_TEST_EXPOSURE: 'ab_test_exposure',
  UPGRADE_PROMPT: 'upgrade_prompt',
};

/**
 * Track a conversion event
 * @param {Object} params
 * @param {string} params.eventType - Type of event
 * @param {string} params.userId - User ID
 * @param {string} params.brandId - Brand ID
 * @param {string} params.jobId - Related job ID
 * @param {string} params.productId - Product ID if applicable
 * @param {Object} params.metadata - Additional event data
 */
async function trackEvent({ eventType, userId, brandId, jobId, productId, metadata = {} }) {
  try {
    const result = await db.query(
      `INSERT INTO conversion_events 
       (event_type, user_id, brand_id, job_id, product_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [eventType, userId, brandId, jobId, productId, JSON.stringify(metadata)]
    );
    
    logger.info('[conversionTracker] Event tracked', { eventType, userId, brandId });
    return result.rows[0].id;
  } catch (error) {
    logger.error('[conversionTracker] Failed to track event', { error: error.message, eventType });
    throw error;
  }
}

/**
 * Track try-on start
 */
async function trackTryOnStart({ userId, brandId, jobId, tryOnType }) {
  return trackEvent({
    eventType: EVENT_TYPES.TRY_ON_START,
    userId,
    brandId,
    jobId,
    metadata: { tryOnType },
  });
}

/**
 * Track try-on complete
 */
async function trackTryOnComplete({ userId, brandId, jobId, tryOnType, resultUrl }) {
  return trackEvent({
    eventType: EVENT_TYPES.TRY_ON_COMPLETE,
    userId,
    brandId,
    jobId,
    metadata: { tryOnType, resultUrl },
  });
}

/**
 * Track product view
 */
async function trackProductView({ userId, brandId, productId, source }) {
  return trackEvent({
    eventType: EVENT_TYPES.PRODUCT_VIEW,
    userId,
    brandId,
    productId,
    metadata: { source },
  });
}

/**
 * Track product click (CTA)
 */
async function trackProductClick({ userId, brandId, productId, source }) {
  return trackEvent({
    eventType: EVENT_TYPES.PRODUCT_CLICK,
    userId,
    brandId,
    productId,
    metadata: { source },
  });
}

module.exports = {
  EVENT_TYPES,
  trackEvent,
  trackTryOnStart,
  trackTryOnComplete,
  trackProductView,
  trackProductClick,
};