/**
 * Product Routes - Product and catalog API
 */
const express = require('express');
const productService = require('../services/productService');

const router = express.Router();

/**
 * GET /api/products
 * Get products with filters
 * Query: category, brand, minPrice, maxPrice, search, limit, offset
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, brand, minPrice, maxPrice, search, limit = 20, offset = 0 } = req.query;
    
    const products = await productService.getProducts({
      category,
      brandId: brand,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await productService.getFeaturedProducts(limit);
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/categories
 * Get all categories
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await productService.getCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/search
 * Search products
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const products = await productService.searchProducts(q, parseInt(limit));
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id/related
 * Get related products
 */
router.get('/:id/related', async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 6;
    
    const products = await productService.getRelatedProducts(id, limit);
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/skus/:id
 * Get SKU by ID
 */
router.get('/skus/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sku = await productService.getSkuById(id);
    
    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }
    
    res.json({ sku });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
