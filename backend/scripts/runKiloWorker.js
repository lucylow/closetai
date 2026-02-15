#!/usr/bin/env node
/**
 * Standalone Kilo agent worker. Run when you want a dedicated process for agent jobs:
 *   node scripts/runKiloWorker.js
 *
 * Requires: Redis, git, and @kilocode/cli installed (npm i -g @kilocode/cli)
 */
require('dotenv').config();
const path = require('path');

// Ensure we load from backend root
process.chdir(path.join(__dirname, '..'));

require('../jobs/kiloAgentQueue');

// Keep process alive
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
