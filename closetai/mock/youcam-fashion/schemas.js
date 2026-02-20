/**
 * JSON Schema Definitions for YouCam Fashion API Mock Data
 * 
 * These schemas define the structure for request/response validation
 * and can be used for mock data generation and testing.
 * 
 * Based on PerfectCorp YouCam API documentation:
 * https://docs.perfectcorp.com/
 */

/**
 * Task Response Schema
 * Used for successful async task responses
 */
const TaskResponseSchema = {
  type: 'object',
  required: ['status', 'data'],
  properties: {
    status: {
      type: 'number',
      description: 'HTTP status code',
      example: 200
    },
    data: {
      type: 'object',
      required: ['task_id', 'estimated_seconds', 'output'],
      properties: {
        task_id: {
          type: 'string',
          description: 'Unique identifier for the task',
          example: 'demo-clothes-tryon-001'
        },
        estimated_seconds: {
          type: 'number',
          description: 'Estimated time until completion',
          example: 2
        },
        output: {
          type: 'object',
          description: 'The output result (available when task is complete)',
          properties: {
            composite_url: {
              type: 'string',
              description: 'URL to the composite try-on image',
              example: '/placeholders/tryon_clothes_demo.png'
            },
            mask: {
              type: ['string', 'object'],
              description: 'URL to mask image or object with multiple masks',
              example: '/placeholders/mask_scarf.png'
            },
            masks: {
              type: 'object',
              description: 'Object containing multiple mask URLs for clothes try-on',
              properties: {
                upper_body: {
                  type: 'string',
                  example: '/placeholders/mask_upper.png'
                },
                lower_body: {
                  type: 'string',
                  example: '/placeholders/mask_lower.png'
                },
                shoes: {
                  type: 'string',
                  example: '/placeholders/mask_shoes.png'
                }
              }
            },
            style: {
              type: 'string',
              description: 'Applied style preset',
              example: 'style_urban_chic'
            },
            style_selected: {
              type: 'string',
              description: 'Selected style preset (alternative field name)',
              example: 'style_bohemian'
            },
            garment_category: {
              type: 'string',
              description: 'The garment category used for try-on',
              enum: ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto'],
              example: 'auto'
            },
            accessory_type: {
              type: 'string',
              description: 'Type of accessory for accessory try-on',
              enum: ['earring', 'bracelet', 'ring', 'necklace', 'watch'],
              example: 'earring'
            }
          }
        }
      }
    }
  }
};

/**
 * Error Response Schema
 * Used for error responses
 */
const ErrorResponseSchema = {
  type: 'object',
  required: ['status', 'error'],
  properties: {
    status: {
      type: 'number',
      description: 'HTTP status code',
      example: 400
    },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          description: 'Error code identifier',
          example: 'invalid_parameter'
        },
        message: {
          type: 'string',
          description: 'Human-readable error message',
          example: 'The garment_category parameter is invalid.'
        },
        details: {
          type: 'object',
          description: 'Additional error details',
          properties: {
            parameter: {
              type: 'string',
              description: 'The parameter that caused the error',
              example: 'garment_category'
            },
            expected_values: {
              type: 'array',
              description: 'List of acceptable values',
              items: {
                type: 'string'
              },
              example: ['full_body', 'upper_body', 'lower_body', 'auto', 'shoes']
            },
            required: {
              type: 'array',
              description: 'List of required fields',
              items: {
                type: 'string'
              },
              example: ['src_file_url', 'ref_file_url']
            }
          }
        }
      }
    }
  }
};

/**
 * Clothes Try-On Request Schema
 */
const ClothesTryOnRequestSchema = {
  type: 'object',
  required: ['src_file_url', 'ref_file_url'],
  properties: {
    src_file_url: {
      type: 'string',
      description: 'URL to the source/user image',
      example: '/placeholders/selfie_demo.jpg'
    },
    ref_file_url: {
      type: 'string',
      description: 'URL to the reference/garment image',
      example: '/placeholders/outfit_reference.jpg'
    },
    garment_category: {
      type: 'string',
      description: 'Category of garment for try-on',
      enum: ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto'],
      default: 'auto',
      example: 'auto'
    },
    change_shoes: {
      type: 'boolean',
      description: 'Whether to change shoes in the try-on',
      default: false,
      example: true
    },
    style: {
      type: 'string',
      description: 'Style preset for the try-on',
      example: 'style_urban_chic'
    }
  }
};

/**
 * Scarf Try-On Request Schema
 */
const ScarfTryOnRequestSchema = {
  type: 'object',
  required: ['src_file_url', 'ref_file_url'],
  properties: {
    src_file_url: {
      type: 'string',
      description: 'URL to the source/user image',
      example: '/placeholders/selfie_demo.jpg'
    },
    ref_file_url: {
      type: 'string',
      description: 'URL to the reference/scarf image',
      example: '/placeholders/scarf_reference.jpg'
    },
    style: {
      type: 'string',
      description: 'Style preset for the scarf try-on',
      enum: [
        'style_french_elegance',
        'style_light_luxury',
        'style_cottagecore',
        'style_modern_chic',
        'style_bohemian'
      ],
      default: 'style_bohemian',
      example: 'style_bohemian'
    }
  }
};

/**
 * Shoes Try-On Request Schema
 */
const ShoesTryOnRequestSchema = {
  type: 'object',
  required: ['src_file_url', 'ref_file_url'],
  properties: {
    src_file_url: {
      type: 'string',
      description: 'URL to the source/user image',
      example: '/placeholders/selfie_demo.jpg'
    },
    ref_file_url: {
      type: 'string',
      description: 'URL to the reference/shoes image',
      example: '/placeholders/shoes_reference.jpg'
    },
    style: {
      type: 'string',
      description: 'Style preset for the shoes try-on',
      enum: [
        'style_minimalist',
        'style_bohemian',
        'style_cottagecore',
        'style_french_elegance',
        'style_retro_fashion'
      ],
      default: 'style_retro_fashion',
      example: 'style_retro_fashion'
    }
  }
};

/**
 * Accessory Try-On Request Schema
 */
const AccessoryTryOnRequestSchema = {
  type: 'object',
  required: ['src_file_url', 'ref_file_url'],
  properties: {
    src_file_url: {
      type: 'string',
      description: 'URL to the source/user image',
      example: '/placeholders/selfie_demo.jpg'
    },
    ref_file_url: {
      type: 'string',
      description: 'URL to the reference/accessory image',
      example: '/placeholders/earrings_reference.jpg'
    },
    accessory_type: {
      type: 'string',
      description: 'Type of accessory to try on',
      enum: ['earring', 'bracelet', 'ring', 'necklace', 'watch'],
      default: 'earring',
      example: 'earring'
    },
    style: {
      type: 'string',
      description: 'Style preset for the accessory',
      default: 'default',
      example: 'default'
    }
  }
};

/**
 * Task Status Response Schema
 */
const TaskStatusResponseSchema = {
  type: 'object',
  required: ['status', 'data'],
  properties: {
    status: {
      type: 'number',
      description: 'HTTP status code',
      example: 200
    },
    data: {
      type: 'object',
      required: ['task_id', 'task_status'],
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID being polled',
          example: 'demo-clothes-tryon-001'
        },
        task_status: {
          type: 'string',
          description: 'Current status of the task',
          enum: ['pending', 'processing', 'success', 'failed'],
          example: 'success'
        },
        progress: {
          type: 'number',
          description: 'Progress percentage (0-100)',
          example: 100
        },
        output: {
          type: 'object',
          description: 'Output result (available when task_status is success)',
          properties: {
            composite_url: {
              type: 'string',
              example: '/placeholders/tryon_result.png'
            },
            mask: {
              type: 'string',
              example: '/placeholders/mask.png'
            }
          }
        },
        error: {
          type: 'object',
          description: 'Error information (available when task_status is failed)',
          properties: {
            code: {
              type: 'string',
              example: 'error_processing_failed'
            },
            message: {
              type: 'string',
              example: 'Task processing failed.'
            }
          }
        }
      }
    }
  }
};

/**
 * Constants Response Schema
 */
const ConstantsResponseSchema = {
  type: 'object',
  required: ['status', 'data'],
  properties: {
    status: {
      type: 'number',
      example: 200
    },
    data: {
      type: 'object',
      required: ['garment_categories', 'scarf_styles', 'shoes_styles', 'accessory_types', 'file_requirements'],
      properties: {
        garment_categories: {
          type: 'array',
          items: { type: 'string' },
          example: ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto']
        },
        scarf_styles: {
          type: 'array',
          items: { type: 'string' },
          example: ['style_french_elegance', 'style_light_luxury', 'style_cottagecore', 'style_modern_chic', 'style_bohemian']
        },
        shoes_styles: {
          type: 'array',
          items: { type: 'string' },
          example: ['style_minimalist', 'style_bohemian', 'style_cottagecore', 'style_french_elegance', 'style_retro_fashion']
        },
        accessory_types: {
          type: 'array',
          items: { type: 'string' },
          example: ['earring', 'bracelet', 'ring', 'necklace', 'watch']
        },
        file_requirements: {
          type: 'object',
          properties: {
            max_size_mb: { type: 'number', example: 10 },
            supported_formats: {
              type: 'array',
              items: { type: 'string' },
              example: ['jpg', 'jpeg', 'png', 'webp']
            },
            min_dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number', example: 256 },
                height: { type: 'number', example: 256 }
              }
            },
            max_dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number', example: 4096 },
                height: { type: 'number', example: 4096 }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Error Codes
 * Documented error codes from PerfectCorp YouCam API
 */
const ErrorCodes = {
  invalid_parameter: {
    message: 'The request parameters are invalid.',
    httpStatus: 400
  },
  error_no_face: {
    message: 'No face detected in source image. Please upload a full-face photo.',
    httpStatus: 400
  },
  error_invalid_ref: {
    message: 'Reference image does not contain valid accessory content.',
    httpStatus: 400
  },
  error_apply_region_mismatch: {
    message: 'Source and reference images don\'t align for placement.',
    httpStatus: 400
  },
  error_file_size_exceeded: {
    message: 'File size exceeds the maximum allowed limit of 10MB.',
    httpStatus: 400
  },
  error_unsupported_format: {
    message: 'Unsupported file format. Please use JPG, PNG, or WEBP.',
    httpStatus: 400
  },
  error_processing_failed: {
    message: 'Task processing failed. Please try again.',
    httpStatus: 500
  },
  error_timeout: {
    message: 'Request timed out. Please try again.',
    httpStatus: 408
  }
};

module.exports = {
  TaskResponseSchema,
  ErrorResponseSchema,
  ClothesTryOnRequestSchema,
  ScarfTryOnRequestSchema,
  ShoesTryOnRequestSchema,
  AccessoryTryOnRequestSchema,
  TaskStatusResponseSchema,
  ConstantsResponseSchema,
  ErrorCodes
};
