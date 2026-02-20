/**
 * Outfits Routes
 * 
 * API endpoints for outfit management and recommendations
 * - Get outfit suggestions
 * - Save outfits
 * - Get outfit details
 * - Virtual try-on
 */

const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { recommendOutfits } = require('../services/recommendationService');
const { generateTryOn } = require('../services/tryOnService');
const logger = require('../lib/logger');

/**
 * POST /api/outfits Get outfit recommendations/suggest
 *
 */
router.post('/suggest', async (req, res) => {
  try {
    const { userId, occasion, weather, limit = 6 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const suggestions = await recommendOutfits({
      userId,
      occasion,
      weather,
      limit
    });
    
    res.json({ suggestions });
  } catch (error) {
    logger.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

/**
 * POST /api/outfits/tryon
 * Request virtual try-on for outfit
 */
router.post('/tryon', async (req, res) => {
  try {
    const { userId, itemIds, userPhotoUrl, params } = req.body;
    
    if (!userId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'userId and itemIds array are required' });
    }
    
    const result = await generateTryOn({
      userId,
      itemIds,
      userPhotoUrl,
      params
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating try-on:', error);
    res.status(500).json({ error: 'Failed to generate try-on' });
  }
});

/**
 * GET /api/outfits/:id
 * Get outfit details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT o.*, 
             json_agg(w.*) as items
      FROM outfits o
      LEFT JOIN wardrobe_items w ON w.id = ANY(o.item_ids)
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching outfit:', error);
    res.status(500).json({ error: 'Failed to fetch outfit' });
  }
});

/**
 * POST /api/outfits/save
 * Save an outfit combination
 */
router.post('/save', async (req, res) => {
  try {
    const { userId, name, itemIds, occasion, score = 0 } = req.body;
    
    if (!userId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'userId and itemIds array are required' });
    }
    
    // Generate cover image from first item
    const itemResult = await db.query(
      'SELECT thumbnail_url FROM wardrobe_items WHERE id = $1',
      [itemIds[0]]
    );
    const coverImage = itemResult.rows[0]?.thumbnail_url || null;
    
    const result = await db.query(`
      INSERT INTO outfits (user_id, name, item_ids, cover_image, occasion, score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, name, itemIds, coverImage, occasion, score]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error saving outfit:', error);
    res.status(500).json({ error: 'Failed to save outfit' });
  }
});

/**
 * GET /api/outfits
 * List user's saved outfits
 */
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 20, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const result = await db.query(`
      SELECT o.*, 
             (SELECT json_agg(w.*) FROM wardrobe_items w WHERE w.id = ANY(o.item_ids)) as items
      FROM outfits o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    res.json({ outfits: result.rows });
  } catch (error) {
    logger.error('Error fetching outfits:', error);
    res.status(500).json({ error: 'Failed to fetch outfits' });
  }
});

/**
 * DELETE /api/outfits/:id
 * Delete a saved outfit
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM outfits WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting outfit:', error);
    res.status(500).json({ error: 'Failed to delete outfit' });
  }
});

/**
 * GET /api/lookbook
 * Get curated lookbook (trending + personal)
 */
router.get('/lookbook', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Get user's top rated outfits
    const userOutfits = await db.query(`
      SELECT * FROM outfits 
      WHERE user_id = $1 AND score > 0.5
      ORDER BY score DESC
      LIMIT 10
    `, [userId]);
    
    // In production, this would also include trending outfits
    // For demo, return user's saved outfits
    res.json({ 
      outfits: userOutfits.rows,
      trends: [] // Would fetch from trend service in production
    });
  } catch (error) {
    logger.error('Error fetching lookbook:', error);
    res.status(500).json({ error: 'Failed to fetch lookbook' });
  }
});

module.exports = router;
