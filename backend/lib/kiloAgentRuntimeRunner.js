// backend/lib/kiloAgentRuntimeRunner.js
// Uses @kilocode/agent-runtime when available to run Kilo agents in-process.
// If the package is not installed or fails, falls back to the CLI-based runner (kiloAgentRunner).
//
// Exports: runAgentWithRuntime(opts) -> { success, exitCode, durationMs, logs, result }
// Notes:
// - runtimeMode: 'inprocess' | 'cli-fallback'
// - Caller should ensure repoUrl is accessible and secrets (GITHUB_TOKEN etc.) are passed via profileEnv.
// - Uses linodeStorage (same as kiloAgentRunner) for audit logs and results.

const fs = require('fs');
const os = require('os');
const path = require('path');
const debug = require('debug')('closet:kilo-runtime');
const { v4: uuidv4 } = require('uuid');
const linodeStorage = require('../services/linode.service');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let AgentRuntime = null;
try {
  AgentRuntime = require('@kilocode/agent-runtime');
  debug('Loaded @kilocode/agent-runtime');
} catch (e) {
  debug('@kilocode/agent-runtime not installed; will fallback to CLI runner if available');
  AgentRuntime = null;
}

const { runKiloAgent: runKiloAgentCLI } = require('./kiloAgentRunner');

/**
 * Clone repo into a temp worktree. Handles file:// URLs for local paths (Windows-compatible).
 */
async function cloneShallow(repoUrl, destPath) {
  // Normalize file:// URLs for git (Windows: file:///C:/path or file://C:\path)
  let url = repoUrl;
  if (url.startsWith('file://')) {
    const p = url.replace(/^file:\/\/+/, '').replace(/\\/g, '/');
    url = `file:///${p}`;
  }
  await execAsync(`git clone --depth 1 "${url}" "${destPath}"`, {
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    maxBuffer: 1024 * 1000,
  });
}

/**
 * runAgentWithRuntime
 * opts:
 *   { repoUrl, agentName, profileEnv = {}, timeoutMs = 10*60*1000, runtimeOptions = {} }
 */
async function runAgentWithRuntime(opts = {}) {
  const {
    repoUrl,
    agentName,
    profileEnv = {},
    timeoutMs = 10 * 60 * 1000,
    runtimeOptions = {},
  } = opts;
  if (!repoUrl || !agentName) throw new Error('repoUrl and agentName required');

  const workdir = path.join(os.tmpdir(), `kilo-agent-runtime-${uuidv4()}`);
  fs.mkdirSync(workdir, { recursive: true });

  try {
    await cloneShallow(repoUrl, workdir);
  } catch (err) {
    try {
      fs.rmSync(workdir, { recursive: true, force: true });
    } catch (e) {
      debug('cleanup workdir failed', e.message);
    }
    return { success: false, error: `clone failed: ${err.message}` };
  }

  if (AgentRuntime) {
    const start = Date.now();
    let timedOut = false;
    let runtime = null;

    const runPromise = (async () => {
      try {
        const runtimeOpts = {
          cwd: workdir,
          env: { ...process.env, ...profileEnv, GIT_TERMINAL_PROMPT: '0' },
          ...runtimeOptions,
        };

        if (typeof AgentRuntime === 'function') {
          runtime = new AgentRuntime(runtimeOpts);
        } else if (AgentRuntime && typeof AgentRuntime.create === 'function') {
          runtime = await AgentRuntime.create(runtimeOpts);
        } else if (AgentRuntime && AgentRuntime.Runtime) {
          runtime = new AgentRuntime.Runtime(runtimeOpts);
        } else {
          throw new Error(
            'Unknown @kilocode/agent-runtime export shape; will fallback to CLI'
          );
        }

        let session = null;
        if (typeof runtime.runAgent === 'function') {
          session = await runtime.runAgent({
            agent: agentName,
            nonInteractive: true,
          });
        } else if (typeof runtime.startSession === 'function') {
          session = await runtime.startSession({
            agent: agentName,
            nonInteractive: true,
          });
        } else if (typeof runtime.run === 'function') {
          session = await runtime.run({
            agent: agentName,
            nonInteractive: true,
          });
        } else {
          throw new Error(
            'Agent runtime does not expose runAgent/startSession/run - unknown API'
          );
        }

        let collectedLogs = '';
        if (session && typeof session.on === 'function') {
          session.on('stdout', (chunk) => {
            collectedLogs += chunk;
            debug('[agent stdout]', chunk);
          });
          session.on('stderr', (chunk) => {
            collectedLogs += chunk;
            debug('[agent stderr]', chunk);
          });
          session.on('log', (chunk) => {
            collectedLogs += chunk;
          });
        } else if (
          session &&
          session.stream &&
          typeof session.stream.on === 'function'
        ) {
          session.stream.on('data', (d) => {
            collectedLogs += d.toString();
          });
        }

        let result = null;
        if (session && typeof session.waitForCompletion === 'function') {
          result = await session.waitForCompletion();
        } else if (session && typeof session.result === 'function') {
          result = await session.result();
        } else if (session && typeof session.awaitCompletion === 'function') {
          result = await session.awaitCompletion();
        } else {
          result = await session;
        }

        const durationMs = Date.now() - start;

        const logsKey = `kilo-runtime-logs/${uuidv4()}.txt`;
        const resultKey = `kilo-runtime-output/${uuidv4()}.json`;
        await linodeStorage.uploadBuffer(
          Buffer.from(collectedLogs || ''),
          logsKey,
          'text/plain'
        );
        await linodeStorage.uploadBuffer(
          Buffer.from(
            JSON.stringify(result || { success: true }, null, 2),
            'utf8'
          ),
          resultKey,
          'application/json'
        );

        if (runtime && typeof runtime.shutdown === 'function') {
          try {
            await runtime.shutdown();
          } catch (e) {
            debug('runtime.shutdown failed', e.message);
          }
        }

        try {
          fs.rmSync(workdir, { recursive: true, force: true });
        } catch (e) {
          debug('cleanup workdir failed', e.message);
        }

        return {
          success: true,
          exitCode: 0,
          durationMs,
          logsKey,
          resultKey,
          rawResult: result,
        };
      } catch (e) {
        debug('agent-runtime run failed', e.message);
        const isApiMismatch =
          /Unknown @kilocode\/agent-runtime export shape|does not expose runAgent|startSession|run/i.test(
            e.message
          );
        if (isApiMismatch) {
          throw Object.assign(
            new Error('AGENT_RUNTIME_API_MISMATCH: ' + e.message),
            { code: 'AGENT_RUNTIME_API_MISMATCH' }
          );
        }
        throw e;
      }
    })();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error('agent-runtime timeout'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([runPromise, timeoutPromise]);
    } catch (err) {
      debug('runtime error or timeout', err.message);
      if (err && err.code === 'AGENT_RUNTIME_API_MISMATCH') {
        debug('Falling back to CLI runner due to runtime API mismatch');
        return runKiloAgentCLI({
          repoUrl,
          agent: agentName,
          profileEnv,
          timeoutMs,
        });
      }
      if (timedOut) {
        if (runtime && typeof runtime.shutdown === 'function') {
          try {
            await runtime.shutdown();
          } catch (_) {
            /* ignore */
          }
        }
        try {
          fs.rmSync(workdir, { recursive: true, force: true });
        } catch (_) {}
        return { success: false, error: 'timeout', timedOut: true };
      }
      debug('Fallback to CLI runner due to runtime error');
      return runKiloAgentCLI({
        repoUrl,
        agent: agentName,
        profileEnv,
        timeoutMs,
      });
    }
  }

  debug('Agent runtime not present, using CLI fallback');
  return runKiloAgentCLI({
    repoUrl,
    agent: agentName,
    profileEnv,
    timeoutMs,
  });
}

module.exports = { runAgentWithRuntime };
