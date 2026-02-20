/**
 * Bull processor for Kilo agent jobs. Runs in the main server process.
 * For a dedicated worker, run: node -e "require('./jobs/kiloAgentQueue')"
 */
const env = require('../config/env');
const logger = require('../utils/logger');
const { getKiloAgentQueue } = require('../lib/queue');
const { runKiloAgent } = require('../lib/kiloAgentRunner');
const { runAgentWithRuntime } = require('../lib/kiloAgentRuntimeRunner');

let kiloAgentQueue = null;

try {
  kiloAgentQueue = getKiloAgentQueue();

  kiloAgentQueue.process(async (job) => {
    if (job.name !== 'kilo-agent') return null;

    const payload = job.data.payload || job.data;
    const {
      repoUrl,
      agent,
      profileEnv = {},
      timeoutMs = 10 * 60 * 1000,
      dryRun = false,
      useRuntime = false,
    } = payload;

    job.progress(10);

    const result =
      useRuntime && !dryRun
        ? await runAgentWithRuntime({
            repoUrl,
            agentName: agent,
            profileEnv,
            timeoutMs,
          })
        : await runKiloAgent({
            repoUrl,
            agent,
            profileEnv,
            timeoutMs,
            dryRun,
          });

    job.progress(100);

    logger.info('Kilo agent job completed', { jobId: job.id, success: result.success });
    return result;
  });

  kiloAgentQueue.on('failed', (job, err) => {
    logger.error('Kilo agent job failed', { jobId: job?.id, error: err?.message });
  });

  logger.info('Kilo agent queue processor registered');
} catch (err) {
  logger.warn('Kilo agent queue disabled (Redis unavailable):', err.message);
}

module.exports = { kiloAgentQueue };
