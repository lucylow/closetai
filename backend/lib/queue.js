// backend/lib/queue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL);

const QUEUE_NAME = 'perfectcorp-jobs';
const STRIPE_QUEUE_NAME = 'stripe-usage-report';

const queue = new Queue(QUEUE_NAME, { connection });

let stripeUsageQueue = null;

function getStripeUsageQueue() {
  if (!stripeUsageQueue) {
    stripeUsageQueue = new Queue(STRIPE_QUEUE_NAME, {
      connection,
      defaultJobOptions: { removeOnComplete: 200, attempts: 3 },
    });
  }
  return stripeUsageQueue;
}

/** Enqueue Stripe metered usage report (async, for hot path) */
async function enqueueStripeUsageReport({ subscriptionItemId, quantity, timestamp }) {
  const q = getStripeUsageQueue();
  return await q.add('stripe-usage-report', {
    subscriptionItemId,
    quantity: quantity ?? 1,
    timestamp: timestamp ?? Math.floor(Date.now() / 1000),
  });
}

/**
 * enqueueJob
 * type: string e.g. 'vton', 'generate', 'measure'
 * payload: object. For 'vton' it must contain { modelKey, garmentKey, opts }
 * returns: job object
 */
async function enqueueJob(type, payload, opts = { removeOnComplete: { age: 3600 * 24 }, removeOnFail: 100 }) {
  if (!type) throw new Error('type is required');
  const job = await queue.add(type, { type, payload }, opts);
  return { id: job.id, name: job.name, timestamp: job.timestamp };
}

/**
 * getJobStatus
 * returns: { id, name, state, progress, returnvalue, failedReason }
 */
async function getJobStatus(jobId) {
  const job = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  const progress = job.progress;
  const returnvalue = job.returnvalue;
  const failedReason = job.failedReason;
  return { id: job.id, name: job.name, state, progress, returnvalue, failedReason };
}

/** Admin: queue depth (waiting + active) for perfectcorp-jobs */
async function getQueueJobCount() {
  try {
    const counts = await queue.getJobCounts();
    return (counts.waiting ?? 0) + (counts.active ?? 0);
  } catch (err) {
    return null;
  }
}

/** Admin: last completed/failed job for judge status */
async function getLastJobInfo() {
  try {
    const [completed, failed] = await Promise.all([
      queue.getCompleted(0, 0),
      queue.getFailed(0, 0),
    ]);
    const lastCompleted = completed[0];
    const lastFailed = failed[0];
    const last = lastCompleted || lastFailed;
    if (!last) return null;
    const finishedAt = last.finishedOn ?? last.processedOn;
    const durationMs = finishedAt && last.processedOn ? finishedAt - last.processedOn : null;
    return {
      id: last.id,
      type: last.name || 'perfectcorp',
      durationMs,
      state: lastCompleted ? 'completed' : 'failed',
      timestamp: last.timestamp,
    };
  } catch (err) {
    return null;
  }
}

/** Admin: full queue counts */
async function getQueueCounts() {
  try {
    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
    };
  } catch (err) {
    return null;
  }
}

/** Admin: recent jobs (active + waiting) */
async function getRecentJobs() {
  try {
    const [active, waiting] = await Promise.all([
      queue.getActive(0, 4),
      queue.getWaiting(0, 4),
    ]);
    return [
      ...active.map((j) => ({ id: j.id, name: j.name || 'vton', state: 'active' })),
      ...waiting.map((j) => ({ id: j.id, name: j.name || 'vton', state: 'waiting' })),
    ].slice(0, 10);
  } catch (err) {
    return [];
  }
}

module.exports = {
  enqueueJob,
  getJobStatus,
  queue,
  getStripeUsageQueue,
  enqueueStripeUsageReport,
  getQueueJobCount,
  getLastJobInfo,
  getQueueCounts,
  getRecentJobs,
};
