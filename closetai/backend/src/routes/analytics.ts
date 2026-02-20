// backend/src/routes/analytics.ts
import express from 'express';
import { DEMO_MODE } from '../lib/env';

const router = express.Router();

// Demo in-memory store for analytics events
const events: any[] = [];

/**
 * POST /api/analytics
 * Track an analytics event
 */
router.post('/', (req, res) => {
  const event = { 
    ...req.body, 
    receivedAt: new Date().toISOString(), 
    demo: DEMO_MODE 
  };
  events.push(event);
  console.log('ANALYTICS', event.event, event);
  res.json({ ok: true });
});

/**
 * GET /api/analytics/recent
 * Get recent analytics events (for debugging/demo)
 */
router.get('/recent', (req, res) => {
  res.json({ events: events.slice(-50) });
});

/**
 * GET /api/analytics/health
 * Health check for analytics service
 */
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    demo: DEMO_MODE,
    eventCount: events.length 
  });
});

export default router;
