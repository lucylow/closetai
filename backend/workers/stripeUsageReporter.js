/**
 * Bull worker: report usage records to Stripe (metered billing).
 * Run as: node workers/stripeUsageReporter.js
 */
const { getStripeUsageQueue } = require('../lib/queue');
const { reportUsageToStripeSync } = require('../services/stripeService');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const STRIPE_CREDITS_KEY = 'stripe:last_credits';

async function runWorker() {
  const queue = getStripeUsageQueue();
  queue.process('stripe-usage-report', async (job) => {
    const { subscriptionItemId, quantity, timestamp } = job.data;
    try {
      await reportUsageToStripeSync({
        subscriptionItemId,
        quantity,
        timestamp,
      });
      await redis.set(STRIPE_CREDITS_KEY, String(quantity), 86400);
      return { ok: true };
    } catch (err) {
      logger.error('Stripe usage report failed', {
        jobId: job.id,
        error: err.message,
      });
      throw err;
    }
  });

  queue.on('completed', (job) => {
    logger.debug('Stripe usage job completed', { jobId: job.id });
  });
  queue.on('failed', (job, err) => {
    logger.error('Stripe usage job failed', { jobId: job?.id, error: err?.message });
  });

  logger.info('Stripe usage reporter worker started');
}

runWorker().catch((err) => {
  logger.error('Worker failed to start', err);
  process.exit(1);
});
