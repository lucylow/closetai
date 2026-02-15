/**
 * Billing API: Stripe customer, subscription.
 * Webhook is mounted separately in server.js with raw body parser.
 */
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const db = require('../lib/db');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * POST /api/billing/create-customer
 * Creates Stripe customer for authenticated user
 */
router.post('/create-customer', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, name } = req.body;
    const userEmail = email || req.user.email;
    if (!userEmail)
      return res.status(400).json({ error: 'email required' });

    const cust = await stripeService.createStripeCustomer({
      userId,
      email: userEmail,
      name: name || req.user.email,
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
 */
router.post('/create-subscription', authenticate, async (req, res) => {
  try {
    const { customerId, priceId } = req.body;
    if (!customerId || !priceId)
      return res.status(400).json({ error: 'customerId and priceId required' });

    const subscription = await stripeService.createSubscription({
      customerId,
      priceId,
    });
    // Store subscription in DB (simplified - map price to plan in your logic)
    const item = subscription.items?.data?.[0];
    await db.query(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, stripe_subscription_item_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, (SELECT id FROM plans WHERE stripe_price_id = $5 LIMIT 1), $6, to_timestamp($7), to_timestamp($8))
       ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = EXCLUDED.status, stripe_subscription_item_id = EXCLUDED.stripe_subscription_item_id`,
      [
        req.user.id,
        subscription.id,
        subscription.customer,
        item?.id || null,
        priceId,
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
      ]
    );
    res.json({ ok: true, subscription });
  } catch (err) {
    console.error('create subscription err', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
