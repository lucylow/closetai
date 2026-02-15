/**
 * Quota enforcement: check usage vs limit, apply overrides, block if exceeded.
 */
const db = require('../lib/db');

/**
 * Get current usage and limit for a user/metric (used by quotaEnforcer and usageService)
 */
async function getUsageAndLimit(userId, metric) {
  const periodStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
  ).toISOString();
  const usageRes = await db.query(
    `SELECT total_value FROM usage_aggregates WHERE user_id = $1 AND metric = $2 AND period_start = $3`,
    [userId, metric, periodStart]
  );
  const total = usageRes.rows[0]
    ? parseInt(usageRes.rows[0].total_value, 10)
    : 0;

  const planRes = await db.query(
    `SELECT q.limit_value
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     JOIN usage_quotas q ON q.plan_id = p.id AND q.metric = $2
     WHERE s.user_id = $1 AND s.status = 'active'
     LIMIT 1`,
    [userId, metric]
  );
  const limit = planRes.rows[0]
    ? parseInt(planRes.rows[0].limit_value, 10)
    : null;

  const overrideRes = await db.query(
    `SELECT extra, expires_at FROM quota_overrides WHERE user_id = $1 AND metric = $2`,
    [userId, metric]
  );
  let extra = 0;
  if (overrideRes.rows[0]) {
    const row = overrideRes.rows[0];
    if (!row.expires_at || new Date(row.expires_at) > new Date()) {
      extra = parseInt(row.extra, 10) || 0;
    }
  }
  const effectiveLimit = limit !== null ? limit + extra : null;
  return { total, limit, effectiveLimit, remaining: effectiveLimit !== null ? Math.max(0, effectiveLimit - total) : null };
}

/**
 * Check and enforce quota. Throws if over limit.
 */
async function checkAndEnforce(userId, metric) {
  const { total, effectiveLimit } = await getUsageAndLimit(userId, metric);
  if (effectiveLimit !== null && total > effectiveLimit) {
    throw new Error('quota_exceeded');
  }
  return true;
}

module.exports = {
  checkAndEnforce,
  getUsageAndLimit,
};
