/**
 * Product Service - Product and SKU operations
 * Handles loading products, SKUs, recommendations
 */
const db = require('../lib/db');
const logger = require('../utils/logger');

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product with SKUs
 */
async function getProductById(productId) {
  const productResult = await db.query(
    `SELECT p.*, b.name as brand_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.id = $1`,
    [productId]
  );
  
  if (productResult.rows.length === 0) {
    return null;
  }
  
  const product = productResult.rows[0];
  
  // Get SKUs
  const skuResult = await db.query(
    `SELECT * FROM skus WHERE product_id = $1`,
    [productId]
  );
  
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    brandId: product.brand_id,
    brandName: product.brand_name,
    category: product.category,
    imageUrl: product.image_url,
    images: product.images,
    price: product.price,
    currency: product.currency,
    metadata: product.metadata,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    skus: skuResult.rows.map(sku => ({
      id: sku.id,
      size: sku.size,
      color: sku.color,
      price: sku.price,
      currency: sku.currency,
      inventoryCount: sku.inventory_count,
      sku: sku.sku,
      metadata: sku.metadata,
    })),
  };
}

/**
 * Get products with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Products
 */
async function getProducts(filters = {}) {
  const { category, brandId, minPrice, maxPrice, limit = 20, offset = 0, search } = filters;
  
  let query = `
    SELECT p.id, p.name, p.description, p.brand_id, p.category, p.price, p.currency, 
           p.image_url, p.metadata, p.created_at,
           b.name as brand_name,
           (SELECT MIN(s.price) FROM skus s WHERE s.product_id = p.id) as min_price,
           (SELECT MAX(s.price) FROM skus s WHERE s.product_id = p.id) as max_price
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (category) {
    params.push(category);
    query += ` AND p.category = $${params.length}`;
  }
  
  if (brandId) {
    params.push(brandId);
    query += ` AND p.brand_id = $${params.length}`;
  }
  
  if (minPrice) {
    params.push(minPrice);
    query += ` AND p.price >= $${params.length}`;
  }
  
  if (maxPrice) {
    params.push(maxPrice);
    query += ` AND p.price <= $${params.length}`;
  }
  
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
  }
  
  query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await db.query(query, params);
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    brandId: row.brand_id,
    brandName: row.brand_name,
    category: row.category,
    imageUrl: row.image_url,
    price: row.price,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    currency: row.currency,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

/**
 * Get SKU by ID
 * @param {string} skuId - SKU ID
 * @returns {Promise<Object>} SKU with product
 */
async function getSkuById(skuId) {
  const result = await db.query(
    `SELECT s.*, p.name as product_name, p.description as product_description,
            p.brand_id, p.category, p.image_url, p.images as product_images,
            b.name as brand_name
     FROM skus s
     JOIN products p ON s.product_id = p.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE s.id = $1`,
    [skuId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productDescription: row.product_description,
    brandId: row.brand_id,
    brandName: row.brand_name,
    category: row.category,
    size: row.size,
    color: row.color,
    price: row.price,
    currency: row.currency,
    inventoryCount: row.inventory_count,
    sku: row.sku,
    imageUrl: row.image_url,
    productImages: row.product_images,
    metadata: row.metadata,
  };
}

/**
 * Get products by category
 * @param {string} category - Category
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Products
 */
async function getProductsByCategory(category, limit = 20) {
  return getProducts({ category, limit });
}

/**
 * Get featured products
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Featured products
 */
async function getFeaturedProducts(limit = 10) {
  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.brand_id, p.category, p.price, 
           p.currency, p.image_url, p.metadata, b.name as brand_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.metadata->>'featured' = 'true'
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    brandId: row.brand_id,
    brandName: row.brand_name,
    category: row.category,
    price: row.price,
    currency: row.currency,
    imageUrl: row.image_url,
    metadata: row.metadata,
  }));
}

/**
 * Get related products
 * @param {string} productId - Product ID
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Related products
 */
async function getRelatedProducts(productId, limit = 6) {
  // Get the category of the current product
  const productResult = await db.query(
    `SELECT category, brand_id FROM products WHERE id = $1`,
    [productId]
  );
  
  if (productResult.rows.length === 0) {
    return [];
  }
  
  const { category, brand_id } = productResult.rows[0];
  
  // Get related products from same category or brand
  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.brand_id, p.category, p.price, 
           p.currency, p.image_url, p.metadata, b.name as brand_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.id != $1 AND (p.category = $2 OR p.brand_id = $3)
     ORDER BY RANDOM()
     LIMIT $4`,
    [productId, category, brand_id, limit]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    brandId: row.brand_id,
    brandName: row.brand_name,
    category: row.category,
    price: row.price,
    currency: row.currency,
    imageUrl: row.image_url,
    metadata: row.metadata,
  }));
}

/**
 * Get all categories
 * @returns {Promise<Array>} Categories
 */
async function getCategories() {
  const result = await db.query(
    `SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category`
  );
  
  return result.rows.map(row => row.category);
}

/**
 * Search products
 * @param {string} query - Search query
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Products
 */
async function searchProducts(query, limit = 20) {
  return getProducts({ search: query, limit });
}

module.exports = {
  getProductById,
  getProducts,
  getSkuById,
  getProductsByCategory,
  getFeaturedProducts,
  getRelatedProducts,
  getCategories,
  searchProducts,
};
