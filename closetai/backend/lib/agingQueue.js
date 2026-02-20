/**
 * Aging Queue Module - BullMQ wrapper for AI Aging jobs
 * Provides priority queues for aging analysis, simulation, and diagnostic report generation
 */

const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const debug = require('debug')('closet:aging-queue');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create Redis connection for aging queues
const agingConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Queue names for aging jobs
const AGING_QUEUE_NAMES = {
  HD: process.env.AGING_HD_QUEUE_NAME || 'closetai-aging-hd-queue',
  LOW: process.env.AGING_LOW_QUEUE_NAME || 'closetai-aging-low-queue'
};

// Default job options for aging jobs
const AGING_JOB_OPTIONS = {
  attempts: Number(process.env.MAX_JOB_RETRIES || 3),
  backoff: {
    type: 'exponential',
    delay: Number(process.env.JOB_BACKOFF_DELAY || 2000)
  },
  removeOnComplete: {
    count: 50,
    age: 3600 * 24 // 24 hours
  },
  removeOnFail: {
    count: 500,
    age: 3600 * 24 * 7 // 7 days
  }
};

// Priority levels
const PRIORITY = {
  HIGH: 1,    // Premium users, HD quality
  NORMAL: 2, // Standard users
  LOW: 3     // Batch processing, free tier
};

// Create aging queues
const agingQueues = {
  hd: new Queue(AGING_QUEUE_NAMES.HD, { 
    connection: agingConnection, 
    defaultJobOptions: { 
      ...AGING_JOB_OPTIONS, 
      priority: PRIORITY.HIGH 
    } 
  }),
  low: new Queue(AGING_QUEUE_NAMES.LOW, { 
    connection: agingConnection, 
    defaultJobOptions: { 
      ...AGING_JOB_OPTIONS, 
      priority: PRIORITY.NORMAL 
    } 
  })
};

/**
 * Get appropriate queue based on quality tier
 * @param {string} tier - 'hd' or 'low'
 */
function getQueue(tier = 'low') {
  return agingQueues[tier] || agingQueues.low;
}

/**
 * Enqueue aging analysis job
 * @param {Object} params - Job parameters
 * @param {string} params.userId - User UUID
 * @param {string} params.jobId - Aging job UUID
 * @param {string} params.srcKey - S3 key for source image
 * @param {Array<string>} params.requestedMetrics - Metrics to analyze
 * @param {string} params.tier - Quality tier ('hd' or 'low')
 * @param {number} params.priority - Job priority
 */
async function enqueueAgingAnalysis({ userId, jobId, srcKey, requestedMetrics, tier = 'low', priority = PRIORITY.NORMAL }) {
  const queue = getQueue(tier);
  
  const job = await queue.add('aging_analysis', {
    userId,
    jobId,
    srcKey,
    requestedMetrics,
    type: 'aging_analysis'
  }, {
    priority,
    ...AGING_JOB_OPTIONS
  });
  
  debug('Enqueued aging analysis job:', { id: job.id, jobId, userId, tier });
  return { id: job.id, jobId: job.id };
}

/**
 * Enqueue aging simulation job
 * @param {Object} params - Job parameters
 * @param {string} params.userId - User UUID
 * @param {string} params.jobId - Aging job UUID
 * @param {string} params.srcKey - S3 key for source image
 * @param {number} params.yearsDelta - Years to simulate
 * @param {string} params.direction - 'older' or 'younger'
 * @param {number} params.strength - Simulation strength
 * @param {string} params.tier - Quality tier
 */
async function enqueueAgingSimulation({ userId, jobId, srcKey, yearsDelta, direction, strength = 0.8, tier = 'low' }) {
  const queue = getQueue(tier);
  
  const job = await queue.add('aging_simulation', {
    userId,
    jobId,
    srcKey,
    yearsDelta,
    direction,
    strength,
    type: 'aging_simulation'
  }, AGING_JOB_OPTIONS);
  
  debug('Enqueued aging simulation job:', { id: job.id, jobId, yearsDelta, direction });
  return { id: job.id, jobId: job.id };
}

/**
 * Enqueue diagnostic report generation job
 * @param {Object} params - Job parameters
 * @param {string} params.userId - User UUID
 * @param {string} params.jobId - Aging job UUID
 * @param {string} params.reportId - Report UUID
 * @param {string} params.locale - Locale for report
 */
async function enqueueDiagnosticReport({ userId, jobId, reportId, locale = 'en-US' }) {
  const queue = agingQueues.low;
  
  const job = await queue.add('diagnostic_report', {
    userId,
    jobId,
    reportId,
    locale,
    type: 'diagnostic_report'
  }, AGING_JOB_OPTIONS);
  
  debug('Enqueued diagnostic report job:', { id: job.id, reportId });
  return { id: job.id };
}

/**
 * Enqueue overlay render job
 * @param {Object} params - Job parameters
 * @param {string} params.userId - User UUID
 * @param {string} params.jobId - Aging job UUID
 * @param {string} params.overlayType - Type of overlay
 */
async function enqueueOverlayRender({ userId, jobId, overlayType }) {
  const queue = agingQueues.low;
  
  const job = await queue.add('overlay_render', {
    userId,
    jobId,
    overlayType,
    type: 'overlay_render'
  }, AGING_JOB_OPTIONS);
  
  debug('Enqueued overlay render job:', { id: job.id, overlayType });
  return { id: job.id };
}

/**
 * Get aging job status
 * @param {string} jobId - BullMQ job ID
 * @param {string} tier - Queue tier
 */
async function getJobStatus(jobId, tier = 'low') {
  const queue = getQueue(tier);
  const job = await queue.getJob(jobId);
  
  if (!job) return null;
  
  const state = await job.getState();
  return {
    id: job.id,
    name: job.name,
    state,
    progress: job.progress,
    data: job.data,
    attempts: job.attemptsMade,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason
  };
}

/**
 * Clean aging queues
 * @param {string} tier - Queue tier to clean
 */
async function cleanAgingQueue(tier = 'low') {
  const queue = getQueue(tier);
  await queue.clean(3600000, 100, 'completed'); // 1 hour grace
  await queue.clean(3600000, 100, 'failed');
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  const hdCounts = await agingQueues.hd.getJobCounts();
  const lowCounts = await agingQueues.low.getJobCounts();
  
  return {
    hd: hdCounts,
    low: lowCounts,
    total: {
      active: hdCounts.active + lowCounts.active,
      waiting: hdCounts.waiting + lowCounts.waiting,
      completed: hdCounts.completed + lowCounts.completed,
      failed: hdCounts.failed + lowCounts.failed
    }
  };
}

module.exports = {
  agingQueues,
  AGING_QUEUE_NAMES,
  PRIORITY,
  enqueueAgingAnalysis,
  enqueueAgingSimulation,
  enqueueDiagnosticReport,
  enqueueOverlayRender,
  getJobStatus,
  cleanAgingQueue,
  getQueueStats,
  getQueue
};
