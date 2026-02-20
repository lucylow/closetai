const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const checkoutService = require('../services/checkoutService');
const router = express.Router();

router.post('/session', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { successUrl, cancelUrl, metadata } = req.body;
    const session = await checkoutService.createCheckoutSession(userId, { successUrl, cancelUrl, metadata });
    res.json(session);
  } catch (error) {
    if (error.message === 'Cart is empty') return res.status(400).json({ error: error.message });
    next(error);
  }
});

/**
 * GET /checkout/success
 * Handle successful checkout redirect
 */
router.get('/success', optionalAuth, async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });
    const result = await checkoutService.handleCheckoutComplete(session_id);
    res.json({ message: 'Checkout completed', orderId: result.orderId, email: result.email });
  } catch (error) {
    next(error);
  }
});

module.exports = router;