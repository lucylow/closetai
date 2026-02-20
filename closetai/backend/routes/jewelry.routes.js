/**
 * Jewelry AR Try-On API Routes
 * 
 * Endpoints:
 * - POST /api/jewelry/tryon - Submit jewelry try-on request
 * - GET /api/jewelry/status/:taskId - Get task status
 * - GET /api/jewelry/types - Get supported jewelry types
 * - POST /api/jewelry/calculate-ring-size - Calculate ring size from measurements
 */

const express = require('express');
const router = express.Router();
const jewelryTryOnService = require('../services/jewelryTryon.service');

/**
 * POST /api/jewelry/tryon
 * Submit jewelry try-on request
 * 
 * Body params:
 * - jewelry_type: string (required) - ring, bracelet, watch, earring, necklace
 * - metal_color: string (optional) - gold, silver, rose_gold, platinum, titanium
 * - gem_color: string (optional) - diamond, emerald, ruby, sapphire, pearl
 * - style: string (optional) - classic, modern, vintage, etc.
 * - src_file_url: string (optional) - URL to source image
 * - consent_version: string (required) - Consent version for GDPR
 */
router.post('/tryon', async (req, res) => {
  try {
    const { jewelry_type, metal_color, gem_color, style, src_file_url, consent_version } = req.body;
    
    // Validate consent
    if (!consent_version) {
      return res.status(400).json({
        status: 400,
        error: {
          code: 'consent_required',
          message: 'consent_version is required for GDPR compliance'
        }
      });
    }
    
    // Call jewelry try-on service
    const result = await jewelryTryOnService.jewelryTryOn({
      jewelry_type,
      metal_color,
      gem_color,
      style,
      src_file_url
    });
    
    res.json(result);
  } catch (error) {
    console.error('[JewelryRoutes] Error:', error);
    res.status(500).json({
      status: 500,
      error: {
        code: 'internal_error',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/jewelry/status/:taskId
 * Get task status
 */
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await jewelryTryOnService.getTaskStatus(taskId);
    res.json(result);
  } catch (error) {
    console.error('[JewelryRoutes] Status error:', error);
    res.status(500).json({
      status: 500,
      error: { code: 'internal_error', message: error.message }
    });
  }
});

/**
 * GET /api/jewelry/types
 * Get supported jewelry types
 */
router.get('/types', (req, res) => {
  res.json({
    status: 200,
    data: {
      jewelry_types: jewelryTryOnService.JEWELRY_TYPES,
      metal_colors: jewelryTryOnService.METAL_COLORS,
      styles: ['classic', 'modern', 'vintage', 'minimalist', 'bohemian'],
      gem_colors: ['diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'topaz', 'amethyst']
    }
  });
});

/**
 * POST /api/jewelry/calculate-ring-size
 * Calculate ring size from finger circumference
 * 
 * Body params:
 * - finger_circumference_mm: number (required)
 */
router.post('/calculate-ring-size', (req, res) => {
  const { finger_circumference_mm } = req.body;
  
  if (!finger_circumference_mm || typeof finger_circumference_mm !== 'number') {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'finger_circumference_mm is required and must be a number'
      }
    });
  }
  
  const result = jewelryTryOnService.calculateRingSize(finger_circumference_mm);
  
  res.json({
    status: 200,
    data: result
  });
});

module.exports = router;
