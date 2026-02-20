/**
 * Run Kilo Cloud Agents via the Kilo CLI (spawned child process).
 * Streams logs, enforces timeouts, supports dry-run, and uploads results to object storage.
 */
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const linodeStorage = require('../services/linode.service');

const execAsync = promisify(exec);

/**
 * Run a Kilo agent against a repo
 * @param {object} opts
 * @param {string} opts.repoUrl - Git URL (https preferred)
 * @param {string} opts.agent - Agent/mode name (e.g. "ship", "refactor", "apply-patch-and-pr")
 * @param {object} opts.profileEnv - Env vars for the agent (e.g. GITHUB_TOKEN)
 * @param {number} opts.timeoutMs - Max runtime
 * @param {boolean} opts.dryRun - If true, log commands without executing
 * @returns {Promise<{success,exitCode,signal,durationMs,logs,result,timedOut,...}>}
 */
async function runKiloAgent({
  repoUrl,
  agent,
  profileEnv = {},
  timeoutMs = 10 * 60 * 1000,
  dryRun = false,
} = {}) {
  if (!repoUrl || !agent) throw new Error('repoUrl and agent required');

  const workdir = path.join(os.tmpdir(), `kilo-agent-${uuidv4()}`);
  fs.mkdirSync(workdir, { recursive: true });

  if (dryRun) {
    logger.info('[Kilo Agent DRY-RUN]', {
      repoUrl,
      agent,
      workdir,
      commands: [
        `git clone --depth 1 ${repoUrl} ${workdir}`,
        `kilo agent run --agent ${agent} --cwd ${workdir} --non-interactive --output json`,
      ],
    });
    return {
      success: true,
      dryRun: true,
      exitCode: 0,
      signal: null,
      durationMs: 0,
      logs: { url: null, key: 'dry-run' },
      result: { url: null, key: 'dry-run' },
      timedOut: false,
    };
  }

  try {
    await execAsync(`git clone --depth 1 ${repoUrl} ${workdir}`, {
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      maxBuffer: 1024 * 1000,
    });
  } catch (err) {
    fs.rmSync(workdir, { recursive: true, force: true });
    throw new Error(`Git clone failed: ${err.message}`);
  }

  const cmd = 'kilo';
  const args = [
    'agent',
    'run',
    '--agent',
    agent,
    '--cwd',
    workdir,
    '--non-interactive',
    '--output',
    'json',
  ];

  const env = {
    ...process.env,
    ...profileEnv,
    GIT_TERMINAL_PROMPT: '0',
  };

  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    const start = Date.now();
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    proc.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      logger.debug('[kilo-agent stdout]', s.trim());
    });
    proc.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      logger.debug('[kilo-agent stderr]', s.trim());
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        exitCode: null,
        signal: null,
        durationMs: Date.now() - start,
        rawStdout: stdout,
        rawStderr: stderr,
        timedOut: false,
        spawnError: err.message,
      });
    });

    proc.on('close', async (code, signal) => {
      clearTimeout(timer);
      const durationMs = Date.now() - start;

      try {
        fs.rmSync(workdir, { recursive: true, force: true });
      } catch (e) {
        logger.warn('Failed to cleanup workdir', workdir, e.message);
      }

      const logsKey = `kilo-agent-logs/${uuidv4()}.txt`;
      const resultKey = `kilo-agent-output/${uuidv4()}.json`;

      try {
        const logsBuf = Buffer.from(`STDOUT\n${stdout}\n\nSTDERR\n${stderr}`);
        const logsUpload = await linodeStorage.uploadBuffer(
          logsBuf,
          logsKey,
          'text/plain'
        );

        let parsed = null;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          parsed = { raw: stdout };
        }

        const outBuf = Buffer.from(
          JSON.stringify(
            { exitCode: code, signal, durationMs, parsed, stderr },
            null,
            2
          )
        );
        const outUpload = await linodeStorage.uploadBuffer(
          outBuf,
          resultKey,
          'application/json'
        );

        resolve({
          success: code === 0 && !timedOut,
          exitCode: code,
          signal,
          durationMs,
          logs: logsUpload,
          result: outUpload,
          timedOut,
        });
      } catch (e) {
        logger.error('Kilo agent storage upload failed', e);
        resolve({
          success: code === 0 && !timedOut,
          exitCode: code,
          signal,
          durationMs,
          rawStdout: stdout,
          rawStderr: stderr,
          timedOut,
          storageError: e.message,
        });
      }
    });
  });
}

module.exports = { runKiloAgent };
