/**
 * Wardrobe Routes
 * 
 * API endpoints for wardrobe management
 * - List user's wardrobe items
 * - Upload new items
 * - Get item details
 * - Delete items
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const { uploadToStorage } = require('../lib/storage');
const logger = require('../lib/logger');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'backend', 'uploads', 'wardrobe'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

/**
 * GET /api/wardrobe
 * List user's wardrobe items with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const { userId, category, limit = 50, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    let query = `
      SELECT id, image_url, thumbnail_url, category, color, tags, attributes, 
             last_worn, wear_count, created_at
      FROM wardrobe_items 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count
    const countQuery = category 
      ? 'SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1 AND category = $2'
      : 'SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1';
    const countParams = category ? [userId, category] : [userId];
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching wardrobe:', error);
    res.status(500).json({ error: 'Failed to fetch wardrobe items' });
  }
});

/**
 * POST /api/wardrobe
 * Upload a new wardrobe item
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { userId, category, color, tags, attributes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    // Upload to storage (or local in demo mode)
    const imageUrl = await uploadToStorage(req.file, `wardrobe/${userId}`);
    const thumbnailUrl = imageUrl; // In production, generate thumbnail
    
    // Parse JSON fields
    const colorArray = color ? JSON.parse(color) : [];
    const tagsArray = tags ? JSON.parse(tags) : [];
    const attrs = attributes ? JSON.parse(attributes) : {};
    
    // Insert into database
    const result = await db.query(`
      INSERT INTO wardrobe_items (user_id, image_url, thumbnail_url, category, color, tags, attributes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, imageUrl, thumbnailUrl, category, colorArray, tagsArray, attrs]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error uploading wardrobe item:', error);
    res.status(500).json({ error: 'Failed to upload wardrobe item' });
  }
});

/**
 * GET /api/wardrobe/:id
 * Get item details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT * FROM wardrobe_items WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * DELETE /api/wardrobe/:id
 * Delete a wardrobe item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM wardrobe_items WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

/**
 * PATCH /api/wardrobe/:id
 * Update item metadata
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, color, tags, attributes, last_worn } = req.body;
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      params.push(JSON.parse(color));
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      params.push(JSON.parse(tags));
    }
    if (attributes !== undefined) {
      updates.push(`attributes = $${paramIndex++}`);
      params.push(JSON.parse(attributes));
    }
    if (last_worn !== undefined) {
      updates.push(`last_worn = $${paramIndex++}`);
      params.push(last_worn);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    const result = await db.query(`
      UPDATE wardrobe_items 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

module.exports = router;
