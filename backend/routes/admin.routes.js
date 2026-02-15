/**
 * Admin routes for judge-friendly status (Akamai/Linode hackathon).
 * GET /admin/status - queue depth, Perfect Corp credits, last job, GPU nodes, recent jobs.
 * GET /admin/billing - Stripe usage queue, last credits.
 * Protected by ADMIN_TOKEN.
 */
const express = require('express');
const router = express.Router();
const {
  getQueueJobCount,
  getLastJobInfo,
  getStripeUsageQueue,
  getQueueCounts,
  getRecentJobs,
} = require('../lib/queue');
const redis = require('../utils/redis');
const db = require('../lib/db');

const CREDIT_KEY = 'closetai:perfectcorp:last_credit';
const STRIPE_CREDITS_KEY = 'stripe:last_credits';

/** Best-effort GPU node info from Kubernetes (optional, requires @kubernetes/client-node) */
async function getGpuUtilization() {
  try {
    const { KubeConfig, CoreV1Api } = require('@kubernetes/client-node');
    const kc = new KubeConfig();
    if (process.env.KUBECONFIG_PATH) {
      kc.loadFromFile(process.env.KUBECONFIG_PATH);
    } else {
      kc.loadFromDefault();
    }
    const k8sApi = kc.makeApiClient(CoreV1Api);
    const nodesResp = await k8sApi.listNode();
    const nodes = nodesResp.body.items;
    return nodes
      .map((n) => {
        const alloc = n.status?.allocatable || {};
        const gpu = alloc['nvidia.com/gpu'] || alloc['alpha.kubernetes.io/nvidia-gpu'] || '0';
        return { name: n.metadata.name, gpu: String(gpu) };
      })
      .filter((n) => Number(n.gpu) > 0);
  } catch (err) {
    return null;
  }
}

router.get('/status', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && token !== adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [queueDepth, lastWorkerJob, perfectCorpCredits, lastStripeCredits, queueCounts, recentJobs, gpuNodes] =
      await Promise.all([
        getQueueJobCount(),
        getLastJobInfo(),
        redis.get(CREDIT_KEY),
        redis.get(STRIPE_CREDITS_KEY),
        getQueueCounts(),
        getRecentJobs(),
        getGpuUtilization(),
      ]);

    res.json({
      ok: true,
      perfectCorpCredits: perfectCorpCredits ?? null,
      lastWorkerJob: lastWorkerJob ?? null,
      queueDepth: queueDepth ?? null,
      lastStripeCredits: lastStripeCredits ?? null,
      queueCounts: queueCounts ?? null,
      recentJobs: recentJobs ?? [],
      gpuNodes: gpuNodes ?? null,
      k8sContext: process.env.K8S_CONTEXT || 'closetai-lke',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('admin/status error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/billing', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && token !== adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = { ok: true, queue: null, lastStripeCredits: null, usersNearQuota: [] };

  try {
    const stripeQueue = getStripeUsageQueue();
    const counts = await stripeQueue.getJobCounts();
    result.queue = {
      waiting: counts.waiting ?? counts.wait ?? 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  } catch (err) {
    result.queueError = err.message;
  }

  try {
    result.lastStripeCredits = await redis.get(STRIPE_CREDITS_KEY);
  } catch (_) {}

  try {
    const nearQuotaRes = await db.query(
      `SELECT u.id, u.email, ua.metric, ua.total_value, q.limit_value
       FROM usage_aggregates ua
       JOIN users u ON u.id = ua.user_id
       JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       JOIN usage_quotas q ON q.plan_id = s.plan_id AND q.metric = ua.metric
       WHERE ua.period_start = date_trunc('month', now())::timestamptz
       AND ua.total_value >= q.limit_value * 0.9
       LIMIT 20`
    );
    result.usersNearQuota = nearQuotaRes.rows;
  } catch (err) {
    result.usersNearQuotaError = err.message;
  }

  res.json(result);
});

module.exports = router;
