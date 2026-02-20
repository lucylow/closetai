const express = require('express');
const router = express.Router();

// Import mock fixtures
const clothesTryonSuccess = require('../../mock/youcam-fashion/clothes_tryon_response_success.json');
const clothesTryonError = require('../../mock/youcam-fashion/clothes_tryon_response_error.json');
const scarfTryonSuccess = require('../../mock/youcam-fashion/scarf_tryon_response_success.json');
const scarfTryonError = require('../../mock/youcam-fashion/scarf_tryon_response_error.json');
const shoesTryonSuccess = require('../../mock/youcam-fashion/shoes_tryon_response_success.json');
const shoesTryonError = require('../../mock/youcam-fashion/shoes_tryon_response_error.json');
const accessoryTryonSuccess = require('../../mock/youcam-fashion/accessory_tryon_response_success.json');
const accessoryTryonError = require('../../mock/youcam-fashion/accessory_tryon_response_error.json');

// Valid garment categories
const validGarmentCategories = ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto'];

// Valid scarf styles
const validScarfStyles = [
  'style_french_elegance',
  'style_light_luxury',
  'style_cottagecore',
  'style_modern_chic',
  'style_bohemian'
];

// Valid shoes styles
const validShoesStyles = [
  'style_minimalist',
  'style_bohemian',
  'style_cottagecore',
  'style_french_elegance',
  'style_retro_fashion'
];

// Valid accessory types
const validAccessoryTypes = ['earring', 'bracelet', 'ring', 'necklace', 'watch'];

// Valid bag types
const validBagTypes = ['handbag', 'crossbody', 'tote', 'clutch', 'backpack'];

// Valid hat types
const validHatTypes = ['cap', 'beanie', 'sun_hat', 'fedora', 'beret'];

// Valid jewelry types
const validJewelryTypes = ['ring', 'bracelet', 'watch', 'earring', 'necklace'];

/**
 * POST /mock/youcam/clothes-tryon
 * Mock endpoint for AI Clothes Try-On
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/clothes-tryon', (req, res) => {
  const { src_file_url, ref_file_url, garment_category } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.json(clothesTryonError);
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate garment_category
  if (garment_category && !validGarmentCategories.includes(garment_category)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The garment_category parameter is invalid.',
        details: {
          parameter: 'garment_category',
          expected_values: validGarmentCategories
        }
      }
    });
  }

  // Return success response with dynamic task_id
  const response = {
    ...clothesTryonSuccess,
    data: {
      ...clothesTryonSuccess.data,
      task_id: `demo-clothes-tryon-${Date.now()}`,
      output: {
        ...clothesTryonSuccess.data.output,
        garment_category: garment_category || 'auto'
      }
    }
  };

  res.json(response);
});

/**
 * POST /mock/youcam/scarf-tryon
 * Mock endpoint for AI Scarf Try-On
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/scarf-tryon', (req, res) => {
  const { src_file_url, ref_file_url, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.json(scarfTryonError);
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate style if provided
  if (style && !validScarfStyles.includes(style)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The style parameter is invalid.',
        details: {
          parameter: 'style',
          expected_values: validScarfStyles
        }
      }
    });
  }

  // Return success response
  const response = {
    ...scarfTryonSuccess,
    data: {
      ...scarfTryonSuccess.data,
      task_id: `demo-scarf-tryon-${Date.now()}`,
      output: {
        ...scarfTryonSuccess.data.output,
        style_selected: style || 'style_bohemian'
      }
    }
  };

  res.json(response);
});

/**
 * POST /mock/youcam/shoes-tryon
 * Mock endpoint for AI Shoes Try-On
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/shoes-tryon', (req, res) => {
  const { src_file_url, ref_file_url, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.json(shoesTryonError);
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate style if provided
  if (style && !validShoesStyles.includes(style)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The style parameter is invalid.',
        details: {
          parameter: 'style',
          expected_values: validShoesStyles
        }
      }
    });
  }

  // Return success response
  const response = {
    ...shoesTryonSuccess,
    data: {
      ...shoesTryonSuccess.data,
      task_id: `demo-shoes-tryon-${Date.now()}`,
      output: {
        ...shoesTryonSuccess.data.output,
        style_selected: style || 'style_retro_fashion'
      }
    }
  };

  res.json(response);
});

/**
 * POST /mock/youcam/accessory-tryon
 * Mock endpoint for Accessory Try-On (jewelry, watch, etc.)
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/accessory-tryon', (req, res) => {
  const { src_file_url, ref_file_url, accessory_type, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.json(accessoryTryonError);
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate accessory_type if provided
  if (accessory_type && !validAccessoryTypes.includes(accessory_type)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The accessory_type parameter is invalid.',
        details: {
          parameter: 'accessory_type',
          expected_values: validAccessoryTypes
        }
      }
    });
  }

  // Return success response
  const response = {
    ...accessoryTryonSuccess,
    data: {
      ...accessoryTryonSuccess.data,
      task_id: `demo-accessory-tryon-${Date.now()}`,
      output: {
        ...accessoryTryonSuccess.data.output,
        accessory_type: accessory_type || 'earring'
      }
    }
  };

  res.json(response);
});

/**
 * POST /mock/youcam/bag-tryon
 * Mock endpoint for AI Bag Try-On
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/bag-tryon', (req, res) => {
  const { src_file_url, ref_file_url, bag_type, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.status(400).json({
      status: 400,
      error: {
        code: 'error_no_body_detected',
        message: 'No body detected in source image. Please upload a full-body photo.'
      }
    });
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate bag_type if provided
  if (bag_type && !validBagTypes.includes(bag_type)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The bag_type parameter is invalid.',
        details: {
          parameter: 'bag_type',
          expected_values: validBagTypes
        }
      }
    });
  }

  // Return success response
  res.json({
    status: 200,
    data: {
      task_id: `demo-bag-tryon-${Date.now()}`,
      estimated_seconds: 2,
      output: {
        composite_url: '/placeholders/tryon_bag_demo.png',
        mask: '/placeholders/mask_bag.png',
        bag_type: bag_type || 'handbag',
        style_used: style || 'casual'
      }
    }
  });
});

/**
 * POST /mock/youcam/hat-tryon
 * Mock endpoint for AI Hat Try-On
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/hat-tryon', (req, res) => {
  const { src_file_url, ref_file_url, hat_type, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    return res.status(400).json({
      status: 400,
      error: {
        code: 'error_no_head_detected',
        message: 'No head detected in source image. Please upload a photo showing your face clearly.'
      }
    });
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate hat_type if provided
  if (hat_type && !validHatTypes.includes(hat_type)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The hat_type parameter is invalid.',
        details: {
          parameter: 'hat_type',
          expected_values: validHatTypes
        }
      }
    });
  }

  // Return success response
  res.json({
    status: 200,
    data: {
      task_id: `demo-hat-tryon-${Date.now()}`,
      estimated_seconds: 1,
      output: {
        composite_url: '/placeholders/tryon_hat_demo.png',
        mask: '/placeholders/mask_hat.png',
        hat_type: hat_type || 'cap',
        style_used: style || 'casual'
      }
    }
  });
});

/**
 * POST /mock/youcam/jewelry-tryon
 * Mock endpoint for Jewelry Try-On (ring, bracelet, watch, earring, necklace)
 * 
 * Query params:
 * - errorMode=true: Force error response
 * - errorCode=<code>: Return specific error code
 */
router.post('/jewelry-tryon', (req, res) => {
  const { src_file_url, ref_file_url, jewelry_type, style } = req.body;
  const { errorMode, errorCode } = req.query;

  // Check for forced error mode
  if (errorMode === 'true') {
    if (errorCode) {
      return res.status(400).json({
        status: 400,
        error: {
          code: errorCode,
          message: getErrorMessage(errorCode)
        }
      });
    }
    // Default jewelry error
    return res.status(400).json({
      status: 400,
      error: {
        code: 'error_invalid_ref',
        message: 'Reference image does not contain valid jewelry content.'
      }
    });
  }

  // Validate required fields
  if (!src_file_url || !ref_file_url) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'Both src_file_url and ref_file_url are required.',
        details: {
          required: ['src_file_url', 'ref_file_url']
        }
      }
    });
  }

  // Validate jewelry_type if provided
  if (jewelry_type && !validJewelryTypes.includes(jewelry_type)) {
    return res.status(400).json({
      status: 400,
      error: {
        code: 'invalid_parameter',
        message: 'The jewelry_type parameter is invalid.',
        details: {
          parameter: 'jewelry_type',
          expected_values: validJewelryTypes
        }
      }
    });
  }

  // Generate appropriate error messages based on jewelry type
  const jewelryErrors = {
    ring: { code: 'error_no_hand_detected', message: 'No hand detected in source image. Please upload a clear photo of your hand.' },
    bracelet: { code: 'error_no_wrist_detected', message: 'No wrist detected in source image. Please upload a clear photo showing your wrist.' },
    watch: { code: 'error_no_wrist_detected', message: 'No wrist detected in source image. Please upload a clear photo showing your wrist.' },
    earring: { code: 'error_no_ear_detected', message: 'No ear detected in source image. Please upload a clear side-profile photo showing your ear.' },
    necklace: { code: 'error_no_neck_detected', message: 'No neck detected in source image. Please upload a photo showing your neck and chest area.' }
  };

  const errorInfo = jewelryErrors[jewelry_type] || jewelryErrors.necklace;

  // Return success response
  res.json({
    status: 200,
    data: {
      task_id: `demo-jewelry-tryon-${Date.now()}`,
      estimated_seconds: 1,
      output: {
        composite_url: '/placeholders/tryon_jewelry_demo.png',
        mask: '/placeholders/mask_jewelry.png',
        jewelry_type: jewelry_type || 'necklace',
        style_used: style || 'elegant'
      }
    }
  });
});

/**
 * GET /mock/youcam/status/:taskId
 * Mock endpoint for polling task status
 */
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { status } = req.query;

  // Simulate different task statuses
  if (status === 'failed') {
    return res.json({
      status: 400,
      data: {
        task_id: taskId,
        task_status: 'failed',
        error: {
          code: 'error_processing_failed',
          message: 'Task processing failed.'
        }
      }
    });
  }

  if (status === 'processing') {
    return res.json({
      status: 200,
      data: {
        task_id: taskId,
        task_status: 'processing',
        progress: 50
      }
    });
  }

  // Default: return success
  res.json({
    status: 200,
    data: {
      task_id: taskId,
      task_status: 'success',
      progress: 100
    }
  });
});

/**
 * Helper function to get error messages for error codes
 */
function getErrorMessage(errorCode) {
  const errorMessages = {
    'invalid_parameter': 'The request parameters are invalid.',
    'error_no_face': 'No face detected in source image. Please upload a full-face photo.',
    'error_invalid_ref': 'Reference image does not contain valid accessory content.',
    'error_apply_region_mismatch': 'Source and reference images don\'t align for placement.',
    'error_file_size_exceeded': 'File size exceeds the maximum allowed limit of 10MB.',
    'error_unsupported_format': 'Unsupported file format. Please use JPG, PNG, or WEBP.',
    'error_processing_failed': 'Task processing failed. Please try again.',
    'error_timeout': 'Request timed out. Please try again.'
  };

  return errorMessages[errorCode] || 'An unknown error occurred.';
}

/**
 * GET /mock/youcam/constants
 * Returns supported constants for YouCam Fashion API
 */
router.get('/constants', (req, res) => {
  res.json({
    status: 200,
    data: {
      garment_categories: validGarmentCategories,
      scarf_styles: validScarfStyles,
      shoes_styles: validShoesStyles,
      accessory_types: validAccessoryTypes,
      bag_types: validBagTypes,
      hat_types: validHatTypes,
      jewelry_types: validJewelryTypes,
      file_requirements: {
        max_size_mb: 10,
        supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
        min_dimensions: { width: 256, height: 256 },
        max_dimensions: { width: 4096, height: 4096 }
      }
    }
  });
});

module.exports = router;
