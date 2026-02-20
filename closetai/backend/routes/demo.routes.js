/**
 * Demo Routes - Express routes for demo mode (no external API calls)
 * Base path: /api/demo
 * 
 * These routes provide a simplified demo experience using local fixtures
 * instead of calling external PerfectCorp APIs.
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

// Helper to read fixture files
async function readFixture(name) {
  const p = path.join(FIXTURES_DIR, name);
  const txt = await fs.readFile(p, 'utf8');
  return JSON.parse(txt);
}

/**
 * POST /api/demo/generate
 * Body: { seedItemIds: string[], context: {...}, options: {...} }
 * 
 * Demo mode: returns fixture recommendations immediately
 */
router.post('/generate', async (req, res) => {
  try {
    const { seedItemIds = [], context = {}, options = {} } = req.body;
    
    // In demo mode, return fixture data immediately
    const data = await readFixture('recommendations_demo.json');
    const results = data.slice(0, options.numResults || 3);
    
    const jobId = `demo-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    res.json({
      jobId,
      status: 'done',
      results,
      context,
      mode: 'demo'
    });
  } catch (err) {
    console.error('Demo generate error:', err);
    res.status(500).json({ error: err.message || 'failed' });
  }
});

/**
 * GET /api/demo/status/:jobId
 * Get job status (always returns done in demo mode)
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // In demo mode, always return done status
    res.json({
      id: jobId,
      status: 'done',
      mode: 'demo'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/demo/tryon
 * Body: { baseImageUrl: string, recommendation: object }
 * 
 * Demo mode: returns fixture tryon result immediately
 */
router.post('/tryon', async (req, res) => {
  try {
    const { baseImageUrl, recommendation } = req.body;
    
    // In demo mode, return fixture data immediately
    const result = await readFixture('tryon_demo_task.json');
    
    const taskId = `demo-tryon-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    res.json({
      taskId,
      status: 'success',
      result,
      mode: 'demo'
    });
  } catch (err) {
    console.error('Demo tryon error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/demo/tryon/:taskId
 * Get tryon task status (always returns success in demo mode)
 */
router.get('/tryon/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // In demo mode, return success with fixture data
    const result = await readFixture('tryon_demo_task.json');
    
    res.json({
      taskId,
      status: 'success',
      result,
      mode: 'demo'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/demo/fixtures/:name
 * Get a specific fixture file
 */
router.get('/fixtures/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = await readFixture(name);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Fixture not found' });
  }
});

/**
 * GET /api/demo/health
 * Health check for demo mode
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'demo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
