const express = require('express');
const router = express.Router();

// DEMO_MODE flag - defaults to true for demo purposes
const DEMO_MODE = process.env.DEMO_MODE !== 'false';

// In-memory demo store (for PR1). Production: use DB + vault/encryption.
const store = {
  perfectcorp: { 
    id: 'perfectcorp', 
    name: 'Perfect Corp', 
    description: 'Virtual Try-On provider', 
    logoUrl: '/assets/sponsors/perfectcorp.svg', 
    connected: false, 
    mode: 'none' 
  },
  youcom: { 
    id: 'youcom', 
    name: 'You.com', 
    description: 'Search / embeddings', 
    logoUrl: '/assets/sponsors/youcom.svg', 
    connected: false, 
    mode: 'none' 
  },
  openai: { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'Text & image generation', 
    logoUrl: '/assets/sponsors/openai.svg', 
    connected: false, 
    mode: 'none' 
  },
  stripe: { 
    id: 'stripe', 
    name: 'Stripe', 
    description: 'Payments provider', 
    logoUrl: '/assets/sponsors/stripe.svg', 
    connected: false, 
    mode: 'none' 
  }
};

/**
 * GET /api/sponsors/list
 * List all sponsors with connection status
 */
router.get('/sponsors/list', (req, res) => {
  res.json({ sponsors: Object.values(store) });
});

/**
 * POST /api/sponsors/connect
 * Connect to a sponsor
 * Body: { id, mode, apiKey }
 */
router.post('/sponsors/connect', (req, res) => {
  const { id, mode, apiKey } = req.body;
  
  if (!store[id]) {
    return res.status(400).json({ error: 'unknown sponsor' });
  }
  
  store[id].connected = true;
  store[id].mode = mode === 'live' ? 'live' : 'demo';
  
  // In production: encrypt and store apiKey securely
  // For demo: do not persist apiKey
  store[id].meta = { 
    connectedAt: new Date().toISOString(), 
    demoNote: DEMO_MODE ? 'connected in DEMO_MODE' : undefined 
  };
  
  res.json({ ok: true, sponsor: store[id] });
});

/**
 * POST /api/sponsors/disconnect
 * Disconnect from a sponsor
 */
router.post('/sponsors/disconnect', (req, res) => {
  const { id } = req.body;
  
  if (!store[id]) {
    return res.status(400).json({ error: 'unknown sponsor' });
  }
  
  store[id].connected = false;
  store[id].mode = 'none';
  store[id].meta = {};
  
  res.json({ ok: true, sponsor: store[id] });
});

/**
 * POST /api/sponsors/test
 * Test connection to a sponsor
 */
router.post('/sponsors/test', (req, res) => {
  const { id } = req.body;
  
  if (!store[id]) {
    return res.status(400).json({ error: 'unknown sponsor' });
  }
  
  if (!store[id].connected) {
    return res.status(400).json({ error: 'sponsor not connected' });
  }
  
  // Return demo responses in DEMO_MODE
  if (DEMO_MODE) {
    return res.json({ 
      ok: true, 
      id, 
      result: `DEMO test success for ${id}`, 
      sampleResponse: { 
        header: 'demo', 
        time: new Date().toISOString(),
        mode: store[id].mode
      } 
    });
  }
  
  // Production: call actual provider health API
  return res.json({ ok: false, error: 'live test not implemented in this scaffold' });
});

module.exports = router;
