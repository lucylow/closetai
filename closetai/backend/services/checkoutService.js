/**
 * Checkout Service - Order processing and Stripe integration
 * Handles checkout flow, payment processing, order creation
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const cartService = require('./cartService');
const stripeService = require('./stripeService');
const logger = require('../utils/logger');

/**
 * Create a checkout session
 * @param {string} userId - User ID
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} Checkout session
 */
async function createCheckoutSession(userId, options = {}) {
  const { successUrl, cancelUrl, metadata = {} } = options;
  
  // Get cart items
  const cartItems = await cartService.getCart(userId);
  
  if (cartItems.length === 0) {
    throw new Error('Cart is empty');
  }
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.sku.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;
  
  // Create line items for Stripe
  const lineItems = cartItems.map(item => ({
    price_data: {
      currency: item.sku.currency || 'usd',
      product_data: {
        name: item.product.name,
        description: item.sku.size ? `${item.sku.size} / ${item.sku.color}` : item.sku.color,
        images: item.product.imageUrl ? [item.product.imageUrl] : [],
        metadata: {
          productId: item.product.id,
          skuId: item.sku.id,
        },
      },
      unit_amount: Math.round(item.sku.price * 100), // Stripe uses cents
    },
    quantity: item.quantity,
  }));
  
  // Add shipping as line item if not free
  if (shipping > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
          description: 'Standard shipping',
        },
        unit_amount: Math.round(shipping * 100),
      },
      quantity: 1,
    });
  }
  
  // Add tax as line item
  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Tax',
        description: 'Sales tax',
      },
      unit_amount: Math.round(tax * 100),
    },
    quantity: 1,
  });
  
  // Create Stripe checkout session
  const session = await stripeService.createCheckoutSession({
    lineItems,
    successUrl: successUrl || `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/checkout/cancel`,
    metadata: {
      userId,
      ...metadata,
    },
  });
  
  // Create pending order in database
  const orderId = uuidv4();
  await db.query(
    `INSERT INTO orders (id, user_id, status, subtotal, shipping, tax, total, currency, stripe_session_id, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [orderId, userId, 'pending', subtotal, shipping, tax, total, 'usd', session.id, JSON.stringify(metadata)]
  );
  
  // Create order items
  for (const item of cartItems) {
    await db.query(
      `INSERT INTO order_items (id, order_id, sku_id, product_id, quantity, unit_price, total_price, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [uuidv4(), orderId, item.sku.id, item.product.id, item.quantity, item.sku.price, item.sku.price * item.quantity]
    );
  }
  
  logger.info('[checkoutService] Created checkout session', { userId, orderId, sessionId: session.id });
  
  return {
    sessionId: session.id,
    url: session.url,
    orderId,
    totals: {
      subtotal,
      shipping,
      tax,
      total,
      currency: 'usd',
    },
  };
}

/**
 * Handle checkout completion (webhook)
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>} Order
 */
async function handleCheckoutComplete(sessionId) {
  // Get session from Stripe
  const session = await stripeService.retrieveCheckoutSession(sessionId);
  
  if (!session || session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }
  
  const userId = session.metadata.userId;
  const customerEmail = session.customer_details?.email;
  
  // Update order status
  const orderResult = await db.query(
    `UPDATE orders 
     SET status = 'confirmed', 
         stripe_payment_intent = session.payment_intent,
         customer_email = $1,
         updated_at = NOW()
     WHERE stripe_session_id = $2
     RETURNING id`,
    [customerEmail, sessionId]
  );
  
  if (orderResult.rows.length === 0) {
    throw new Error('Order not found');
  }
  
  const orderId = orderResult.rows[0].id;
  
  // Reduce inventory
  const orderItems = await db.query(
    `SELECT oi.sku_id, oi.quantity FROM order_items oi WHERE oi.order_id = $1`,
    [orderId]
  );
  
  for (const item of orderItems.rows) {
    await db.query(
      `UPDATE skus SET inventory_count = inventory_count - $1 WHERE id = $2`,
      [item.quantity, item.sku_id]
    );
  }
  
  // Clear cart
  await cartService.clearCart(userId);
  
  // Record conversion event
  await db.query(
    `INSERT INTO conversion_events (user_id, event_type, order_id, revenue, currency, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, 'checkout_completed', orderId, session.amount_total / 100, 'usd', JSON.stringify({ sessionId })]
  );
  
  logger.info('[checkoutService] Checkout completed', { userId, orderId, sessionId });
  
  return {
    orderId,
    status: 'confirmed',
    email: customerEmail,
  };
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Order
 */
async function getOrder(orderId, userId) {
  const result = await db.query(
    `SELECT o.*, 
            (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
     FROM orders o
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const order = result.rows[0];
  return {
    id: order.id,
    userId: order.user_id,
    status: order.status,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    customerEmail: order.customer_email,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    stripePaymentIntent: order.stripe_payment_intent,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: order.items || [],
  };
}

/**
 * Get user's orders
 * @param {string} userId - User ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 * @returns {Promise<Array>} Orders
 */
async function getOrders(userId, limit = 10, offset = 0) {
  const result = await db.query(
    `SELECT o.id, o.status, o.total, o.currency, o.created_at,
            (SELECT json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price))
             FROM order_items oi WHERE oi.order_id = o.id) as items
     FROM orders o
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return result.rows.map(order => ({
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.created_at,
    items: order.items || [],
  }));
}

/**
 * Update order shipping address
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {Object} address - Shipping address
 * @returns {Promise<Object>} Updated order
 */
async function updateShippingAddress(orderId, userId, address) {
  const result = await db.query(
    `UPDATE orders 
     SET shipping_address = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [JSON.stringify(address), orderId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Order not found');
  }
  
  return result.rows[0];
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Cancelled order
 */
async function cancelOrder(orderId, userId) {
  const result = await db.query(
    `UPDATE orders 
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'confirmed')
     RETURNING *`,
    [orderId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Order not found or cannot be cancelled');
  }
  
  // Restore inventory
  const orderItems = await db.query(
    `SELECT sku_id, quantity FROM order_items WHERE order_id = $1`,
    [orderId]
  );
  
  for (const item of orderItems.rows) {
    await db.query(
      `UPDATE skus SET inventory_count = inventory_count + $1 WHERE id = $2`,
      [item.quantity, item.sku_id]
    );
  }
  
  logger.info('[checkoutService] Order cancelled', { userId, orderId });
  
  return result.rows[0];
}

module.exports = {
  createCheckoutSession,
  handleCheckoutComplete,
  getOrder,
  getOrders,
  updateShippingAddress,
  cancelOrder,
};
