// backend/lib/queue.js
// BullMQ queue wrapper for gen jobs
const { Queue, QueueScheduler } = require("bullmq");
const IORedis = require("ioredis");
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) { console.warn("Warning: REDIS_URL not set; queue will fail."); }
const connection = new IORedis(REDIS_URL);
const QUEUE_NAME = process.env.QUEUE_NAME || "gen-queue";
const scheduler = new QueueScheduler(QUEUE_NAME, { connection });
const queue = new Queue(QUEUE_NAME, { connection });
async function addJob(name, data, opts) {
  return queue.add(name, data, {
    attempts: opts?.attempts || 3,
    backoff: opts?.backoff || { type: "exponential", delay: 2000 },
    removeOnComplete: opts?.removeOnComplete || 100,
    removeOnFail: opts?.removeOnFail || 1000,
    priority: opts?.priority || 0,
    ...opts
  });
}
module.exports = { queue, addJob, scheduler, connection };
