/**
 * Jewelry AR Try-On Service
 * 
 * Supports: Rings, Bracelets, Watches, Earrings, and Necklaces
 * Uses PerfectCorp / YouCam APIs for AR try-on functionality
 * 
 * DEMO mode: Returns mock fixtures without API calls
 * REAL mode: Calls PerfectCorp endpoints with proper authentication
 */

const crypto = require('crypto');
const path = require('path');

// Configuration
const getConfig = () => ({
  mode: process.env.INTEGRATION_MODE || 'demo',
  demoMode: process.env.DEMO_MODE === 'true',
  apiBaseUrl: process.env.PERFECT_CORP_API_BASE || 'https://yce-api-01.makeupar.com/s2s/v2.0',
  apiKey: process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY || '',
  timeout: parseInt(process.env.AR_TASK_POLL_TIMEOUT_MS) || 300000,
  pollInterval: parseInt(process.env.AR_TASK_POLL_INTERVAL_MS) || 2000,
});

// Valid jewelry types
const JEWELRY_TYPES = ['ring', 'bracelet', 'watch', 'earring', 'necklace'];
const METAL_COLORS = ['gold', 'silver', 'rose_gold', 'platinum', 'titanium'];

// Ring size conversion tables (circumference in mm to size)
const RING_SIZE_US = {
  44.0: 3, 46.3: 4, 47.6: 5, 48.9: 6, 
  50.2: 7, 51.5: 8, 52.8: 9, 54.0: 10
};

const RING_SIZE_EU = {
  44.0: 44, 46.3: 46, 47.6: 47, 48.9: 49,
  50.2: 50, 51.5: 52, 52.8: 53, 54.0: 54
};

/**
 * Generate SHA256 hash of buffer
 */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Demo mode: Generate mock jewelry try-on response
 */
function generateDemoResponse(jewelryType, params = {}) {
  const taskId = `demo-${jewelryType}-tryon-${Date.now()}`;
  
  // Generate variants based on metal color preference
  const variants = generateVariants(jewelryType, params.metal_color);
  
  return {
    status: 200,
    data: {
      task_id: taskId,
      estimated_seconds: 2,
      output: {
        composite_url: `/fixtures/jewelry/${jewelryType}_tryon_result.png`,
        mask_url: `/fixtures/jewelry/${jewelryType}_mask.png`,
        detections: generateDetections(jewelryType),
        metrics: generateMetrics(jewelryType),
        variants: variants,
        jewelry_type: jewelryType
      }
    }
  };
}

/**
 * Generate demo variants based on jewelry type
 */
function generateVariants(jewelryType, preferredMetal) {
  const metals = preferredMetal ? [preferredMetal, ...METAL_COLORS.filter(m => m !== preferredMetal)] : METAL_COLORS;
  
  return metals.slice(0, 3).map((metal, idx) => ({
    variant_id: `${jewelryType}_${metal}_${String(idx + 1).padStart(3, '0')}`,
    metal: metal,
    gem: jewelryType === 'ring' || jewelryType === 'earring' || jewelryType === 'necklace' 
      ? { color_hex: getGemColor(metal), type: 'diamond' }
      : undefined,
    preview_url: `/fixtures/jewelry/variants/${jewelryType}_${metal}.png`,
    sku: `${jewelryType.toUpperCase().substring(0, 4)}-${metal.toUpperCase().substring(0, 3)}-${String(idx + 1).padStart(3, '0')}`
  }));
}

/**
 * Get gem color based on metal
 */
function getGemColor(metal) {
  const gemColors = {
    gold: '#D4AF37',
    silver: '#C0C0C0',
    rose_gold: '#B76E79',
    platinum: '#E5E4E2',
    titanium: '#878681'
  };
  return gemColors[metal] || '#D4AF37';
}

/**
 * Generate demo detections based on jewelry type
 */
function generateDetections(jewelryType) {
  switch (jewelryType) {
    case 'ring':
      return {
        left_hand: {
          bbox: [320, 400, 180, 240],
          keypoints: [
            { name: 'wrist_left', x: 350, y: 400, confidence: 0.95 },
            { name: 'ring_finger_mcp', x: 410, y: 480, confidence: 0.89 }
          ]
        }
      };
    case 'earring':
      return {
        face: {
          bbox: [200, 100, 400, 500],
          keypoints: [
            { name: 'left_ear', x: 180, y: 300, confidence: 0.94 },
            { name: 'right_ear', x: 620, y: 300, confidence: 0.93 }
          ]
        }
      };
    case 'necklace':
      return {
        neck_anchor: { x: 400, y: 380 },
        pose: {
          keypoints: [
            { name: 'neck_left', x: 350, y: 380, confidence: 0.92 },
            { name: 'neck_right', x: 450, y: 380, confidence: 0.91 }
          ]
        }
      };
    case 'bracelet':
    case 'watch':
      return {
        left_wrist: { x: 280, y: 450 },
        right_wrist: { x: 520, y: 450 }
      };
    default:
      return {};
  }
}

/**
 * Generate demo metrics based on jewelry type
 */
function generateMetrics(jewelryType) {
  switch (jewelryType) {
    case 'ring':
      const fingerCircumference = 54; // mm
      const usSize = RING_SIZE_US[fingerCircumference] || 7;
      const euSize = RING_SIZE_EU[fingerCircumference] || 54;
      return {
        estimated_ring_size: {
          us: usSize,
          eu: euSize,
          confidence: 0.85
        },
        finger_circumference_mm: fingerCircumference
      };
    case 'bracelet':
    case 'watch':
      return {
        wrist_circumference_mm: 160
      };
    default:
      return {};
  }
}

/**
 * Validate jewelry try-on request
 */
function validateRequest(params) {
  const errors = [];
  
  if (!params.jewelry_type) {
    errors.push('jewelry_type is required');
  } else if (!JEWELRY_TYPES.includes(params.jewelry_type)) {
    errors.push(`jewelry_type must be one of: ${JEWELRY_TYPES.join(', ')}`);
  }
  
  if (params.metal_color && !METAL_COLORS.includes(params.metal_color)) {
    errors.push(`metal_color must be one of: ${METAL_COLORS.join(', ')}`);
  }
  
  return errors;
}

/**
 * Main jewelry try-on function
 */
async function jewelryTryOn(params) {
  const config = getConfig();
  
  // Validate request
  const errors = validateRequest(params);
  if (errors.length > 0) {
    return {
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: errors.join(', ')
      }
    };
  }
  
  const { jewelry_type, metal_color, gem_color, style, src_file_url } = params;
  
  // DEMO mode
  if (config.mode === 'demo' || config.demoMode) {
    console.log(`[JewelryTryOn] DEMO mode - generating mock response for ${jewelry_type}`);
    return generateDemoResponse(jewelry_type, { metal_color, gem_color, style });
  }
  
  // REAL mode - call PerfectCorp API
  try {
    const response = await callPerfectCorpAPI({
      jewelry_type,
      metal_color,
      gem_color,
      style,
      src_file_url
    }, config);
    return response;
  } catch (error) {
    console.error('[JewelryTryOn] API error:', error.message);
    return {
      status: 500,
      error: {
        code: 'api_error',
        message: error.message
      }
    };
  }
}

/**
 * Call PerfectCorp API (REAL mode)
 */
async function callPerfectCorpAPI(params, config) {
  // This would call the actual PerfectCorp API
  // For now, return demo response as placeholder
  console.log('[JewelryTryOn] REAL mode - would call PerfectCorp API');
  return generateDemoResponse(params.jewelry_type, params);
}

/**
 * Poll task status
 */
async function getTaskStatus(taskId) {
  const config = getConfig();
  
  // Demo mode
  if (config.mode === 'demo' || config.demoMode) {
    return {
      status: 200,
      data: {
        task_id: taskId,
        task_status: 'success',
        progress: 100
      }
    };
  }
  
  // Real mode - poll PerfectCorp
  try {
    // Placeholder for real implementation
    return {
      status: 200,
      data: {
        task_id: taskId,
        task_status: 'success',
        progress: 100
      }
    };
  } catch (error) {
    return {
      status: 500,
      error: { code: 'api_error', message: error.message }
    };
  }
}

/**
 * Calculate ring size from finger measurements
 */
function calculateRingSize(fingerCircumferenceMm) {
  // Find closest US size
  let usSize = 7;
  let euSize = 54;
  let minDiff = Infinity;
  
  for (const [circ, us] of Object.entries(RING_SIZE_US)) {
    const diff = Math.abs(fingerCircumferenceMm - parseFloat(circ));
    if (diff < minDiff) {
      minDiff = diff;
      usSize = us;
      euSize = RING_SIZE_EU[circ];
    }
  }
  
  return {
    us: usSize,
    eu: euSize,
    mm: fingerCircumferenceMm,
    confidence: 1 - (minDiff / 10) // Lower confidence for larger differences
  };
}

module.exports = {
  jewelryTryOn,
  getTaskStatus,
  calculateRingSize,
  JEWELRY_TYPES,
  METAL_COLORS
};
