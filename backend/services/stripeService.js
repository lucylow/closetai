/**
 * Stripe integration: customers, subscriptions, metered usage, webhooks.
 */
const Stripe = require('stripe');
const env = require('../config/env');
const { User } = require('../models');
const { enqueueStripeUsageReport } = require('../lib/queue');

const stripe = env.stripe?.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: '2024-11-20.acacia' })
  : null;

async function createStripeCustomer({ userId, email, name }) {
  if (!stripe) throw new Error('Stripe not configured');
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: { userId },
  });
  await User.update(
    { stripeCustomerId: customer.id },
    { where: { id: userId } }
  );
  return customer;
}

async function createSubscription({ customerId, priceId, trialPeriodDays = 0 }) {
  if (!stripe) throw new Error('Stripe not configured');
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialPeriodDays || undefined,
    expand: ['latest_invoice.payment_intent'],
  });
  return subscription;
}

/**
 * Report usage to Stripe (async via queue - preferred for hot path)
 */
async function reportUsageToStripeAsync({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
}) {
  const job = await enqueueStripeUsageReport({
    subscriptionItemId,
    quantity,
    timestamp,
  });
  return job.id;
}

/**
 * Synchronous usage report (use in worker only)
 */
async function reportUsageToStripeSync({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
}) {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp,
    action: 'increment',
  });
}

function constructEvent({ payload, sig }) {
  if (!stripe) throw new Error('Stripe not configured');
  const webhookSecret = env.stripe?.webhookSecret;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe.webhooks.constructEvent(payload, sig, webhookSecret);
}

module.exports = {
  stripe,
  createStripeCustomer,
  createSubscription,
  reportUsageToStripeAsync,
  reportUsageToStripeSync,
  constructEvent,
};
