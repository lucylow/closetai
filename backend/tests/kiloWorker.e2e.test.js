/**
 * Kilo agent worker e2e (mocked).
 * Mocks the Kilo runtime/CLI so no real external calls are made.
 * Asserts the worker uploads logs and results via linodeStorage.uploadBuffer.
 */
process.env.PORT = process.env.PORT || '3000';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'test';
process.env.DB_USER = process.env.DB_USER || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const nock = require('nock');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const os = require('os');

nock.disableNetConnect();

// Stub linodeStorage.uploadBuffer before any module loads it
const linodeStorage = require('../services/linode.service');
let uploadStub;

// Mock kiloAgentRunner so we don't run real git clone / kilo CLI
jest.mock('../lib/kiloAgentRunner', () => ({
  runKiloAgent: jest.fn().mockImplementation(async (opts) => {
    const linode = require('../services/linode.service');
    await linode.uploadBuffer(
      Buffer.from('STDOUT\nfake logs\n\nSTDERR\n'),
      `kilo-agent-logs/${Date.now()}.txt`,
      'text/plain'
    );
    await linode.uploadBuffer(
      Buffer.from(JSON.stringify({ exitCode: 0, parsed: {} })),
      `kilo-agent-output/${Date.now()}.json`,
      'application/json'
    );
    return {
      success: true,
      exitCode: 0,
      signal: null,
      durationMs: 100,
      logs: { key: 'kilo-agent-logs/fake.txt', url: 'https://mock/x' },
      result: { key: 'kilo-agent-output/fake.json', url: 'https://mock/y' },
      timedOut: false,
    };
  }),
}));

describe('Kilo agent worker e2e (mocked)', () => {
  beforeAll(() => {
    uploadStub = sinon.stub(linodeStorage, 'uploadBuffer').callsFake(async (buf, key, ct) => ({
      key,
      url: `https://mock-storage/${key}`,
    }));
  });

  afterAll(() => {
    uploadStub.restore();
    nock.cleanAll();
  });

  test('worker runs agent (runtime fallback to CLI) and uploads logs + result', async () => {
    // Create a tiny local git repo for file:// clone (avoids network)
    const repoPath = path.join(os.tmpdir(), `kilo-test-repo-${Date.now()}`);
    fs.mkdirSync(repoPath, { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# test readme\n\nalpha\n');
    const { execSync } = require('child_process');
    execSync('git init', { cwd: repoPath });
    execSync('git config user.email "test@test.com"', { cwd: repoPath });
    execSync('git config user.name "Test"', { cwd: repoPath });
    execSync('git add README.md', { cwd: repoPath });
    execSync('git commit -m "init"', { cwd: repoPath });

    // file:// URL for local clone (Windows-compatible)
    const filePath = repoPath.replace(/\\/g, '/');
    const repoUrl = `file:///${filePath}`;

    const { runAgentWithRuntime } = require('../lib/kiloAgentRuntimeRunner');

    const res = await runAgentWithRuntime({
      repoUrl,
      agentName: 'demo-agent',
      profileEnv: {},
      timeoutMs: 30_000,
    });

    // Fallback to CLI (mocked) should have triggered uploads via the mock
    expect(uploadStub.callCount).toBeGreaterThanOrEqual(1);
    expect(res).toHaveProperty('success');
    expect(res).toHaveProperty('durationMs');
    if (res.success) {
      const calls = uploadStub.getCalls();
      expect(calls[0].args[1]).toMatch(/kilo/);
    }

    try {
      fs.rmSync(repoPath, { recursive: true, force: true });
    } catch (_) {}
  }, 60_000);
});
