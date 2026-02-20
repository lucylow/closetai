/**
 * YouCam Fashion Mock Service
 * 
 * Frontend mock wrapper for YouCam/PerfectCorp Fashion API virtual try-on endpoints.
 * This service provides mock implementations for demo mode before switching to real API.
 * 
 * Supported endpoints:
 * - AI Clothes Try-On (full_body, upper_body, lower_body, shoes, auto)
 * - AI Scarf Try-On (optional style presets)
 * - AI Shoes Try-On (style presets)
 * - Accessory Try-On (jewelry, watch, etc.)
 */

import { API_BASE_URL } from '@/config';

// Default API base URL (can be overridden via config)

/**
 * Request types for YouCam Fashion API
 */
export interface ClothesTryOnRequest {
  src_file_url: string;
  ref_file_url: string;
  garment_category?: 'full_body' | 'upper_body' | 'lower_body' | 'shoes' | 'auto';
  change_shoes?: boolean;
  style?: string;
}

export interface ScarfTryOnRequest {
  src_file_url: string;
  ref_file_url: string;
  style?: string;
}

export interface ShoesTryOnRequest {
  src_file_url: string;
  ref_file_url: string;
  style?: string;
}

export interface AccessoryTryOnRequest {
  src_file_url: string;
  ref_file_url: string;
  accessory_type?: 'earring' | 'bracelet' | 'ring' | 'necklace' | 'watch';
  style?: string;
}

/**
 * Response types for YouCam Fashion API
 */
export interface TryOnSuccessResponse {
  status: number;
  data: {
    task_id: string;
    estimated_seconds: number;
    output: {
      composite_url: string;
      mask?: string | Record<string, string>;
      masks?: {
        upper_body?: string;
        lower_body?: string;
        shoes?: string;
      };
      style?: string;
      style_selected?: string;
      garment_category?: string;
      accessory_type?: string;
    };
  };
}

export interface TryOnErrorResponse {
  status: number;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type TryOnResponse = TryOnSuccessResponse | TryOnErrorResponse;

/**
 * Task status response for polling
 */
export interface TaskStatusResponse {
  status: number;
  data: {
    task_id: string;
    task_status: 'pending' | 'processing' | 'success' | 'failed';
    progress?: number;
    output?: {
      composite_url: string;
      mask?: string;
    };
    error?: {
      code: string;
      message: string;
    };
  };
}

/**
 * Constants for YouCam Fashion API
 */
export const YC_FASHION_CONSTANTS = {
  garment_categories: ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto'] as const,
  scarf_styles: [
    'style_french_elegance',
    'style_light_luxury',
    'style_cottagecore',
    'style_modern_chic',
    'style_bohemian'
  ] as const,
  shoes_styles: [
    'style_minimalist',
    'style_bohemian',
    'style_cottagecore',
    'style_french_elegance',
    'style_retro_fashion'
  ] as const,
  accessory_types: ['earring', 'bracelet', 'ring', 'necklace', 'watch'] as const,
  file_requirements: {
    max_size_mb: 10,
    supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
    min_dimensions: { width: 256, height: 256 },
    max_dimensions: { width: 4096, height: 4096 }
  }
} as const;

/**
 * Mock service configuration
 */
interface MockServiceConfig {
  baseUrl?: string;
  useMock?: boolean;
  mockDelay?: number; // Simulated delay in ms
}

let config: MockServiceConfig = {
  baseUrl: typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api',
  useMock: true, // Default to mock mode
  mockDelay: 500
};

/**
 * Configure the mock service
 */
export function configureYouCamMockService(newConfig: Partial<MockServiceConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current configuration
 */
export function getYouCamMockConfig(): MockServiceConfig {
  return { ...config };
}

/**
 * Simulate network delay
 */
function simulateDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, config.mockDelay));
}

/**
 * Check if response is an error
 */
function isErrorResponse(response: TryOnResponse): response is TryOnErrorResponse {
  return response.status >= 400;
}

/**
 * AI Clothes Try-On
 * 
 * @param request - Clothes try-on request parameters
 * @returns Promise resolving to try-on response
 */
export async function tryonClothes(request: ClothesTryOnRequest): Promise<TryOnResponse> {
  if (config.useMock) {
    await simulateDelay();
    
    // Simulate validation errors
    if (!request.src_file_url || !request.ref_file_url) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'Both src_file_url and ref_file_url are required.',
          details: { required: ['src_file_url', 'ref_file_url'] }
        }
      };
    }

    // Validate garment_category
    if (request.garment_category && !YC_FASHION_CONSTANTS.garment_categories.includes(request.garment_category)) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'The garment_category parameter is invalid.',
          details: {
            parameter: 'garment_category',
            expected_values: YC_FASHION_CONSTANTS.garment_categories
          }
        }
      };
    }

    // Return success mock response
    return {
      status: 200,
      data: {
        task_id: `demo-clothes-tryon-${Date.now()}`,
        estimated_seconds: 2,
        output: {
          composite_url: '/placeholders/tryon_clothes_demo.png',
          masks: {
            upper_body: '/placeholders/mask_upper.png',
            lower_body: '/placeholders/mask_lower.png',
            shoes: '/placeholders/mask_shoes.png'
          },
          style: request.style || 'style_urban_chic',
          garment_category: request.garment_category || 'auto'
        }
      }
    };
  }

  // Real API call
  const response = await fetch(`${config.baseUrl}/mock/youcam/clothes-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * AI Scarf Try-On
 * 
 * @param request - Scarf try-on request parameters
 * @returns Promise resolving to try-on response
 */
export async function tryonScarf(request: ScarfTryOnRequest): Promise<TryOnResponse> {
  if (config.useMock) {
    await simulateDelay();
    
    // Simulate validation errors
    if (!request.src_file_url || !request.ref_file_url) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'Both src_file_url and ref_file_url are required.',
          details: { required: ['src_file_url', 'ref_file_url'] }
        }
      };
    }

    // Validate style
    if (request.style && !YC_FASHION_CONSTANTS.scarf_styles.includes(request.style as typeof YC_FASHION_CONSTANTS.scarf_styles[number])) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'The style parameter is invalid.',
          details: {
            parameter: 'style',
            expected_values: YC_FASHION_CONSTANTS.scarf_styles
          }
        }
      };
    }

    // Return success mock response
    return {
      status: 200,
      data: {
        task_id: `demo-scarf-tryon-${Date.now()}`,
        estimated_seconds: 1,
        output: {
          composite_url: '/placeholders/tryon_scarf_demo.png',
          mask: '/placeholders/mask_scarf.png',
          style_selected: request.style || 'style_bohemian'
        }
      }
    };
  }

  // Real API call
  const response = await fetch(`${config.baseUrl}/mock/youcam/scarf-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * AI Shoes Try-On
 * 
 * @param request - Shoes try-on request parameters
 * @returns Promise resolving to try-on response
 */
export async function tryonShoes(request: ShoesTryOnRequest): Promise<TryOnResponse> {
  if (config.useMock) {
    await simulateDelay();
    
    // Simulate validation errors
    if (!request.src_file_url || !request.ref_file_url) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'Both src_file_url and ref_file_url are required.',
          details: { required: ['src_file_url', 'ref_file_url'] }
        }
      };
    }

    // Validate style
    if (request.style && !YC_FASHION_CONSTANTS.shoes_styles.includes(request.style as typeof YC_FASHION_CONSTANTS.shoes_styles[number])) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'The style parameter is invalid.',
          details: {
            parameter: 'style',
            expected_values: YC_FASHION_CONSTANTS.shoes_styles
          }
        }
      };
    }

    // Return success mock response
    return {
      status: 200,
      data: {
        task_id: `demo-shoes-tryon-${Date.now()}`,
        estimated_seconds: 1,
        output: {
          composite_url: '/placeholders/tryon_shoes_demo.png',
          mask: '/placeholders/mask_shoes.png',
          style_selected: request.style || 'style_retro_fashion'
        }
      }
    };
  }

  // Real API call
  const response = await fetch(`${config.baseUrl}/mock/youcam/shoes-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * Accessory Try-On (jewelry, watch, etc.)
 * 
 * @param request - Accessory try-on request parameters
 * @returns Promise resolving to try-on response
 */
export async function tryonAccessory(request: AccessoryTryOnRequest): Promise<TryOnResponse> {
  if (config.useMock) {
    await simulateDelay();
    
    // Simulate validation errors
    if (!request.src_file_url || !request.ref_file_url) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'Both src_file_url and ref_file_url are required.',
          details: { required: ['src_file_url', 'ref_file_url'] }
        }
      };
    }

    // Validate accessory_type
    if (request.accessory_type && !YC_FASHION_CONSTANTS.accessory_types.includes(request.accessory_type)) {
      return {
        status: 400,
        error: {
          code: 'invalid_parameter',
          message: 'The accessory_type parameter is invalid.',
          details: {
            parameter: 'accessory_type',
            expected_values: YC_FASHION_CONSTANTS.accessory_types
          }
        }
      };
    }

    // Return success mock response
    return {
      status: 200,
      data: {
        task_id: `demo-accessory-tryon-${Date.now()}`,
        estimated_seconds: 1,
        output: {
          composite_url: '/placeholders/tryon_earrings_demo.png',
          mask: '/placeholders/mask_earrings.png',
          accessory_type: request.accessory_type || 'earring'
        }
      }
    };
  }

  // Real API call
  const response = await fetch(`${config.baseUrl}/mock/youcam/accessory-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * Poll task status
 * 
 * @param taskId - The task ID to poll
 * @param status - Force a specific status (for testing)
 * @returns Promise resolving to task status
 */
export async function pollTaskStatus(taskId: string, status?: 'processing' | 'success' | 'failed'): Promise<TaskStatusResponse> {
  if (config.useMock) {
    await simulateDelay();
    
    // Simulate different statuses
    if (status === 'failed') {
      return {
        status: 400,
        data: {
          task_id: taskId,
          task_status: 'failed',
          error: {
            code: 'error_processing_failed',
            message: 'Task processing failed.'
          }
        }
      };
    }

    if (status === 'processing') {
      return {
        status: 200,
        data: {
          task_id: taskId,
          task_status: 'processing',
          progress: 50
        }
      };
    }

    // Default: return success
    return {
      status: 200,
      data: {
        task_id: taskId,
        task_status: 'success',
        progress: 100,
        output: {
          composite_url: '/placeholders/tryon_result.png'
        }
      }
    };
  }

  // Real API call
  const url = status 
    ? `${config.baseUrl}/mock/youcam/status/${taskId}?status=${status}`
    : `${config.baseUrl}/mock/youcam/status/${taskId}`;
    
  const response = await fetch(url);
  return response.json();
}

/**
 * Get supported constants from API
 * 
 * @returns Promise resolving to constants
 */
export async function getYouCamConstants(): Promise<{
  garment_categories: string[];
  scarf_styles: string[];
  shoes_styles: string[];
  accessory_types: string[];
  file_requirements: typeof YC_FASHION_CONSTANTS.file_requirements;
}> {
  if (config.useMock) {
    await simulateDelay();
    return {
      garment_categories: [...YC_FASHION_CONSTANTS.garment_categories],
      scarf_styles: [...YC_FASHION_CONSTANTS.scarf_styles],
      shoes_styles: [...YC_FASHION_CONSTANTS.shoes_styles],
      accessory_types: [...YC_FASHION_CONSTANTS.accessory_types],
      file_requirements: { ...YC_FASHION_CONSTANTS.file_requirements }
    };
  }

  const response = await fetch(`${config.baseUrl}/mock/youcam/constants`);
  const result = await response.json();
  return result.data;
}

/**
 * Force an error response for testing
 * 
 * @param endpoint - The endpoint to test
 * @param errorCode - The error code to return
 * @returns Promise resolving to error response
 */
export async function testErrorResponse(
  endpoint: 'clothes-tryon' | 'scarf-tryon' | 'shoes-tryon' | 'accessory-tryon',
  errorCode: string
): Promise<TryOnErrorResponse> {
  if (!config.useMock) {
    const response = await fetch(
      `${config.baseUrl}/mock/youcam/${endpoint}?errorMode=true&errorCode=${errorCode}`,
      { method: 'POST' }
    );
    return response.json();
  }

  // In mock mode, return predefined error
  return {
    status: 400,
    error: {
      code: errorCode,
      message: getErrorMessage(errorCode)
    }
  };
}

/**
 * Get error message for error code
 */
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
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

export default {
  configureYouCamMockService,
  getYouCamMockConfig,
  tryonClothes,
  tryonScarf,
  tryonShoes,
  tryonAccessory,
  pollTaskStatus,
  getYouCamConstants,
  testErrorResponse,
  constants: YC_FASHION_CONSTANTS
};
