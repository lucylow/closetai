/**
 * Cart Service - Shopping cart operations
 * Handles adding, removing, and viewing cart items
 */
const db = require('../lib/db');
const logger = require('../utils/logger');

/**
 * Get cart for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Cart items
 */
async function getCart(userId) {
  const result = await db.query(
    `SELECT ci.id, ci.sku_id, ci.quantity, ci.added_at,
            s.id as sid, s.product_id, s.size, s.color, s.price, s.currency, s.inventory_count,
            p.id as pid, p.name, p.description, p.brand_id, p.category, p.image_url, p.metadata
     FROM cart ci
     JOIN skus s ON ci.sku_id = s.id
     JOIN products p ON s.product_id = p.id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    quantity: row.quantity,
    addedAt: row.added_at,
    sku: {
      id: row.sid,
      productId: row.product_id,
      size: row.size,
      color: row.color,
      price: row.price,
      currency: row.currency,
      inventoryCount: row.inventory_count,
    },
    product: {
      id: row.pid,
      name: row.name,
      description: row.description,
      brandId: row.brand_id,
      category: row.category,
      imageUrl: row.image_url,
      metadata: row.metadata,
    },
  }));
}

/**
 * Add item to cart
 * @param {string} userId - User ID
 * @param {string} skuId - SKU ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Cart item
 */
async function addItem(userId, skuId, quantity = 1) {
  // Check if item already in cart
  const existing = await db.query(
    `SELECT id, quantity FROM cart WHERE user_id = $1 AND sku_id = $2`,
    [userId, skuId]
  );
  
  if (existing.rows.length > 0) {
    // Update quantity
    const newQuantity = existing.rows[0].quantity + quantity;
    await db.query(
      `UPDATE cart SET quantity = $1, added_at = NOW() WHERE id = $2`,
      [newQuantity, existing.rows[0].id]
    );
    logger.info('[cartService] Updated cart item quantity', { userId, skuId, quantity: newQuantity });
    return { id: existing.rows[0].id, quantity: newQuantity };
  }
  
  // Check inventory
  const skuResult = await db.query(
    `SELECT inventory_count FROM skus WHERE id = $1`,
    [skuId]
  );
  
  if (skuResult.rows.length === 0) {
    throw new Error('SKU not found');
  }
  
  if (skuResult.rows[0].inventory_count < quantity) {
    throw new Error('Insufficient inventory');
  }
  
  // Add new item
  const result = await db.query(
    `INSERT INTO cart (user_id, sku_id, quantity, added_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, sku_id, quantity, added_at`,
    [userId, skuId, quantity]
  );
  
  logger.info('[cartService] Added item to cart', { userId, skuId, quantity });
  
  return result.rows[0];
}

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} cartItemId - Cart item ID
 * @returns {Promise<boolean>}
 */
async function removeItem(userId, cartItemId) {
  const result = await db.query(
    `DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id`,
    [cartItemId, userId]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  logger.info('[cartService] Removed item from cart', { userId, cartItemId });
  return true;
}

/**
 * Update item quantity in cart
 * @param {string} userId - User ID
 * @param {string} cartItemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart item
 */
async function updateQuantity(userId, cartItemId, quantity) {
  if (quantity <= 0) {
    return removeItem(userId, cartItemId);
  }
  
  // Check inventory
  const cartItem = await db.query(
    `SELECT ci.sku_id FROM cart ci WHERE ci.id = $1 AND ci.user_id = $2`,
    [cartItemId, userId]
  );
  
  if (cartItem.rows.length === 0) {
    throw new Error('Cart item not found');
  }
  
  const skuResult = await db.query(
    `SELECT inventory_count FROM skus WHERE id = $1`,
    [cartItem.rows[0].sku_id]
  );
  
  if (skuResult.rows[0].inventory_count < quantity) {
    throw new Error('Insufficient inventory');
  }
  
  const result = await db.query(
    `UPDATE cart SET quantity = $1, added_at = NOW() 
     WHERE id = $2 AND user_id = $3 
     RETURNING id, sku_id, quantity`,
    [quantity, cartItemId, userId]
  );
  
  logger.info('[cartService] Updated cart item quantity', { userId, cartItemId, quantity });
  
  return result.rows[0];
}

/**
 * Clear cart for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function clearCart(userId) {
  await db.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);
  logger.info('[cartService] Cleared cart', { userId });
  return true;
}

/**
 * Get cart total
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Cart total
 */
async function getCartTotal(userId) {
  const result = await db.query(
    `SELECT SUM(s.price * ci.quantity) as subtotal, COUNT(*) as item_count
     FROM cart ci
     JOIN skus s ON ci.sku_id = s.id
     WHERE ci.user_id = $1`,
    [userId]
  );
  
  const row = result.rows[0];
  return {
    subtotal: parseFloat(row.subtotal) || 0,
    itemCount: parseInt(row.item_count) || 0,
    currency: 'USD',
  };
}

module.exports = {
  getCart,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  getCartTotal,
};
