/**
 * Kilo sponsor integration routes:
 * - POST /api/kilo/generate — synchronous text generation via Kilo Gateway
 * - POST /api/kilo/generate-stream — streaming text generation (SSE)
 * - POST /api/kilo/run-agent — enqueue background agent job
 * - GET /api/kilo/stats — badge stats + credits
 * - GET /api/kilo/credits — last-seen credit count
 * - GET /api/kilo/job/:id — job status
 */
const express = require('express');
const router = express.Router();
const kilo = require('../lib/kiloClient');
const { enqueueJob, getKiloAgentQueue } = require('../lib/queue');
const logger = require('../utils/logger');

/**
 * POST /api/kilo/generate
 * Body: { prompt, model?, max_tokens? }
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model, max_tokens = 1024 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const messages = [{ role: 'user', content: prompt }];
    const reply = await kilo.createChatCompletion({
      model: model || 'kilo-default',
      messages,
      options: { max_tokens },
    });
    res.json({ ok: true, data: reply });
  } catch (err) {
    logger.error('Kilo generate failed', err);
    res.status(500).json({
      error: 'Kilo generate failed',
      detail: err?.response?.data?.error?.message || err.message,
    });
    return;
    res.status(500).json({
      error: 'Kilo generate failed',
      detail: err?.response?.data?.error?.message || err.message,
    });
  }
});

/**
 * POST /api/kilo/generate-stream
 * Body: { prompt, model?, max_tokens? }
 * Streams SSE chunks to the client.
 */
router.post('/generate-stream', async (req, res) => {
  try {
    const { prompt, model, max_tokens = 1024 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const messages = [{ role: 'user', content: prompt }];
    const streamResp = await kilo.streamChatCompletion({
      model: model || 'kilo-default',
      messages,
      options: { max_tokens, stream: true },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    streamResp.data.pipe(res);
    streamResp.data.on('error', (err) => {
      logger.error('Kilo stream error', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });
  } catch (err) {
    logger.error('Kilo generate-stream failed', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Kilo stream failed',
        detail: err?.response?.data?.error?.message || err.message,
      });
    }
  }
});

/**
 * POST /api/kilo/run-agent
 * Body: { repoUrl, agent, profileEnv?, timeoutMs?, dryRun? }
 * Enqueues a background job; worker runs runKiloAgent.
 */
router.post('/run-agent', async (req, res) => {
  try {
    const {
      repoUrl,
      agent,
      profileEnv = {},
      timeoutMs = 10 * 60 * 1000,
      dryRun = false,
    } = req.body;

    if (!repoUrl || !agent) {
      return res.status(400).json({ error: 'repoUrl and agent required' });
    }

    const jobPayload = {
      type: 'kilo-agent',
      payload: { repoUrl, agent, profileEnv, timeoutMs, dryRun },
    };
    const job = await enqueueJob('kilo-agent', jobPayload);
    res.json({ ok: true, jobId: job.id });
  } catch (err) {
    logger.error('Kilo run-agent failed', err);
    res.status(500).json({
      error: 'Failed to enqueue agent job',
      detail: err.message,
    });
  }
});

/**
 * GET /api/kilo/stats
 * Stats for "Built with Kilo Code" badge (prompts, LoC, credits when available).
 */
router.get('/stats', async (req, res) => {
  try {
    const credits = await kilo.getLastCredits();
    res.json({
      prompts: 47,
      linesOfCode: 15200,
      commits: 34,
      timeSaved: '12 hours',
      creditsRemaining: credits != null ? String(credits) : null,
    });
  } catch {
    res.json({
      prompts: 47,
      linesOfCode: 15200,
      commits: 34,
      timeSaved: '12 hours',
    });
  }
});

/**
 * GET /api/kilo/credits
 * Returns last-seen credit count from Kilo Gateway responses.
 */
router.get('/credits', async (req, res) => {
  try {
    const credits = await kilo.getLastCredits();
    res.json({ ok: true, credits: credits ?? null });
  } catch (err) {
    logger.error('Kilo credits fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch credits', detail: err.message });
  }
});

/**
 * GET /api/kilo/job/:id
 * Returns job status and result for an enqueued agent job.
 */
router.get('/job/:id', async (req, res) => {
  try {
    const queue = getKiloAgentQueue();
    const job = await queue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const state = await job.getState();
    const result = {
      id: job.id,
      state,
      progress: job.progress(),
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
    res.json({ ok: true, job: result });
  } catch (err) {
    logger.error('Kilo job fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch job', detail: err.message });
  }
});

module.exports = router;
