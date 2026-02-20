/**
 * Stripe webhook handler. Mount with bodyParser.raw BEFORE express.json().
 */
const stripeService = require('../services/stripeService');
const db = require('../lib/db');

module.exports = async (req, res) => {
  if (!stripeService.stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripeService.constructEvent({
      payload: req.body,
      sig,
    });
    if (event.type === 'invoice.payment_succeeded') {
      // Optionally record payment in DB
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      await db.query(
        `UPDATE subscriptions SET status = $1, current_period_start = to_timestamp($2), current_period_end = to_timestamp($3), cancel_at_period_end = $4
         WHERE stripe_subscription_id = $5`,
        [
          sub.status,
          sub.current_period_start,
          sub.current_period_end,
          sub.cancel_at_period_end,
          sub.id,
        ]
      );
      if (sub.items?.data?.[0]) {
        await db.query(
          `UPDATE subscriptions SET stripe_subscription_item_id = $1 WHERE stripe_subscription_id = $2`,
          [sub.items.data[0].id, sub.id]
        );
      }
    } else if (event.type === 'customer.subscription.deleted') {
      await db.query(
        `UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = $1`,
        [event.data.object.id]
      );
    } else if (event.type === 'invoice.payment_failed') {
      // Mark subscription unpaid / notify
    }
    res.json({ received: true });
  } catch (err) {
    console.error('stripe webhook error', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
