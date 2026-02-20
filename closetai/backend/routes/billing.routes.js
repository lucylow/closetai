/**
 * Billing API: Stripe customer, subscription.
 * Supports JWT auth (req.user) or demo mode (userId in body).
 * Webhook is mounted separately in server.js with raw body parser.
 */
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const db = require('../lib/db');
const { optionalAuthenticate } = require('../middleware/auth.middleware');

function resolveUserId(req) {
  return req.user?.id || req.body.userId;
}

/**
 * POST /api/billing/create-customer
 * body: { userId?, email, name } — userId required when not authenticated
 */
router.post('/create-customer', optionalAuthenticate, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { email, name } = req.body;
    const userEmail = email || req.user?.email;
    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'userId and email required (or use JWT)' });
    }

    const cust = await stripeService.createStripeCustomer({
      userId,
      email: userEmail,
      name: name || userEmail,
    });
    res.json({ ok: true, customer: cust.id });
  } catch (err) {
    console.error('create customer err', err);
    res.status(500).json({ error: 'failed' });
  }
});

/**
 * POST /api/billing/create-subscription
 * body: { customerId, priceId }
 * Looks up user by stripe_customer_id for subscription mapping.
 */
router.post('/create-subscription', optionalAuthenticate, async (req, res) => {
  try {
    const { customerId, priceId } = req.body;
    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'customerId and priceId required' });
    }

    const subscription = await stripeService.createSubscription({
      customerId,
      priceId,
    });

    const item = subscription.items?.data?.[0];
    const userRes = await db.query(
      `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
      [subscription.customer]
    );
    const userId = userRes.rows[0]?.id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: 'User not found for customer' });
    }

    await db.query(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, stripe_subscription_item_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, (SELECT id FROM plans WHERE stripe_price_id = $5 LIMIT 1), $6, to_timestamp($7), to_timestamp($8))
       ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = EXCLUDED.status, stripe_subscription_item_id = EXCLUDED.stripe_subscription_item_id`,
      [
        userId,
        subscription.id,
        subscription.customer,
        item?.id || null,
        priceId,
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
      ]
    );
    res.json({
      ok: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (err) {
    console.error('create subscription err', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
