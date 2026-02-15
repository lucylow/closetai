/**
 * Usage reporting and checking. Writes to usage_events, usage_aggregates,
 * enforces quotas, and optionally reports to Stripe.
 */
const db = require('../lib/db');
const { reportUsageToStripeAsync } = require('./stripeService');
const { checkAndEnforce, getUsageAndLimit } = require('./quotaEnforcer');
const analyticsService = require('./analyticsService');

/**
 * Get subscription item ID for a user/metric (for Stripe metered billing)
 */
async function getSubscriptionItemIdForMetric(userId, metric) {
  const res = await db.query(
    `SELECT stripe_subscription_item_id FROM subscriptions
     WHERE user_id = $1 AND status = 'active'
     LIMIT 1`,
    [userId]
  );
  const itemId = res.rows[0]?.stripe_subscription_item_id;
  if (!itemId) return null;
  return itemId;
}

/**
 * Report usage: insert event, update aggregate, enforce quota, report to Stripe.
 */
async function reportUsage({
  userId,
  metric,
  value = 1,
  reportedBy = 'server',
}) {
  await db.query(
    `INSERT INTO usage_events (user_id, metric, value, reported_by) VALUES ($1, $2, $3, $4)`,
    [userId, metric, value, reportedBy]
  );

  const periodStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
  ).toISOString();
  const periodEnd = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)
  ).toISOString();

  await db.query(
    `INSERT INTO usage_aggregates (user_id, metric, period_start, period_end, total_value)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, metric, period_start)
     DO UPDATE SET total_value = usage_aggregates.total_value + EXCLUDED.total_value, updated_at = now()`,
    [userId, metric, periodStart, periodEnd, value]
  );

  const allowed = await checkAndEnforce(userId, metric);

  const subItemId = await getSubscriptionItemIdForMetric(userId, metric);
  if (subItemId) {
    await reportUsageToStripeAsync({
      subscriptionItemId: subItemId,
      quantity: value,
    });
  }

  await analyticsService.trackEvent(userId, 'Usage Reported', {
    metric,
    value,
    reportedBy,
  });

  return { allowed };
}

/**
 * Get usage for user/metric: { total, limit, remaining }
 */
async function getUsageForUser(userId, metric) {
  const { total, limit, remaining } = await getUsageAndLimit(userId, metric);
  return { total, limit, remaining };
}

module.exports = {
  reportUsage,
  getUsageForUser,
};
