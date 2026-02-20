/**
 * Webhook Service
 * 
 * Handles webhooks for job completion events
 * Supports real-time UI updates and third-party integrations
 */
const axios = require('axios');
const db = require('../lib/db');

const WEBHOOK_EVENTS = {
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  CREDIT_LOW: 'credit.low',
  CREDIT_EXHAUSTED: 'credit.exhausted',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
};

/**
 * Send webhook to a user's registered URL
 */
async function sendWebhook(userId, event, payload) {
  try {
    // Get user's webhook URL
    const result = await db.query(
      `SELECT webhook_url, webhook_secret 
       FROM user_settings 
       WHERE user_id = $1`,
      [userId]
    );
    
    const webhook = result.rows[0];
    if (!webhook?.webhook_url) {
      console.log(`[Webhook] No webhook URL for user ${userId}`);
      return { sent: false, reason: 'no_webhook_configured' };
    }
    
    // Build signed payload
    const timestamp = Date.now();
    const body = JSON.stringify({
      event,
      timestamp,
      data: payload,
    });
    
    // Create signature (simplified - use HMAC in production)
    const signature = webhook.webhook_secret 
      ? `${webhook.webhook_secret}:${timestamp}:${body}`
      : null;
    
    // Send webhook
    const response = await axios.post(webhook.webhook_url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': timestamp,
        ...(signature && { 'X-Webhook-Signature': signature }),
      },
      timeout: 10000,
    });
    
    console.log(`[Webhook] Sent ${event} to user ${userId}:`, response.status);
    return { sent: true, statusCode: response.status };
    
  } catch (error) {
    console.error(`[Webhook] Failed to send ${event} to user ${userId}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Notify job completion
 */
async function notifyJobCompleted(jobId, userId, result) {
  return sendWebhook(userId, WEBHOOK_EVENTS.JOB_COMPLETED, {
    jobId,
    type: result.type,
    status: 'completed',
    resultUrl: result.resultUrl,
    signedUrl: result.signedUrl,
    metadata: result.metadata,
  });
}

/**
 * Notify job failure
 */
async function notifyJobFailed(jobId, userId, error) {
  return sendWebhook(userId, WEBHOOK_EVENTS.JOB_FAILED, {
    jobId,
    status: 'failed',
    error: error.message || error,
  });
}

/**
 * Notify low credits
 */
async function notifyLowCredits(userId, balance, threshold) {
  return sendWebhook(userId, WEBHOOK_EVENTS.CREDIT_LOW, {
    balance,
    threshold,
    message: `Your credit balance (${balance}) is below ${threshold}`,
  });
}

/**
 * Notify exhausted credits
 */
async function notifyCreditsExhausted(userId) {
  return sendWebhook(userId, WEBHOOK_EVENTS.CREDIT_EXHAUSTED, {
    message: 'Your credits have been exhausted. Please purchase more credits to continue.',
  });
}

/**
 * Register webhook for a user
 */
async function registerWebhook(userId, webhookUrl, webhookSecret = null) {
  await db.query(
    `INSERT INTO user_settings (user_id, webhook_url, webhook_secret, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET webhook_url = $2, webhook_secret = $3, updated_at = NOW()`,
    [userId, webhookUrl, webhookSecret]
  );
  
  return { registered: true, webhookUrl };
}

/**
 * Remove webhook for a user
 */
async function removeWebhook(userId) {
  await db.query(
    `UPDATE user_settings SET webhook_url = NULL, webhook_secret = NULL, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
  
  return { removed: true };
}

module.exports = {
  WEBHOOK_EVENTS,
  sendWebhook,
  notifyJobCompleted,
  notifyJobFailed,
  notifyLowCredits,
  notifyCreditsExhausted,
  registerWebhook,
  removeWebhook,
};
