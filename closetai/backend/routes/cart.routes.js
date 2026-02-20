/**
 * Cart Routes - Shopping cart API
 * Endpoints for cart operations
 */
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const cartService = require('../services/cartService');

const router = express.Router();

/**
 * GET /api/cart
 * Get user's cart
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [cart, totals] = await Promise.all([
      cartService.getCart(userId),
      cartService.getCartTotal(userId),
    ]);
    
    res.json({
      items: cart,
      ...totals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/items
 * Add item to cart
 * Body: { skuId, quantity }
 */
router.post('/items', authenticate, async (req, res, next) => {
  try {
    const { skuId, quantity = 1 } = req.body;
    const userId = req.user.id;
    
    if (!skuId) {
      return res.status(400).json({ error: 'skuId is required' });
    }
    
    const item = await cartService.addItem(userId, skuId, quantity);
    
    res.status(201).json({
      message: 'Item added to cart',
      item,
    });
  } catch (error) {
    if (error.message === 'SKU not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Insufficient inventory') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * PUT /api/cart/items/:itemId
 * Update item quantity
 * Body: { quantity }
 */
router.put('/items/:itemId', authenticate, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    if (quantity === undefined) {
      return res.status(400).json({ error: 'quantity is required' });
    }
    
    const item = await cartService.updateQuantity(userId, itemId, quantity);
    
    res.json({
      message: 'Cart updated',
      item,
    });
  } catch (error) {
    if (error.message === 'Cart item not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Insufficient inventory') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
router.delete('/items/:itemId', authenticate, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    const removed = await cartService.removeItem(userId, itemId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart
 * Clear cart
 */
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await cartService.clearCart(userId);
    
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
