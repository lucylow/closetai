/**
 * Jewelry AR Try-On Service
 * 
 * Frontend service for calling the jewelry try-on API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface JewelryTryOnParams {
  jewelry_type: 'ring' | 'bracelet' | 'watch' | 'earring' | 'necklace';
  metal_color?: 'gold' | 'silver' | 'rose_gold' | 'platinum' | 'titanium';
  gem_color?: string;
  style?: string;
  src_file_url?: string;
  consent_version: string;
}

export interface JewelryVariant {
  variant_id: string;
  metal: string;
  gem?: { color_hex: string; type: string };
  preview_url: string;
  sku: string;
}

export interface JewelryTaskResult {
  status: number;
  data?: {
    task_id: string;
    status: string;
    output?: {
      composite_url: string;
      mask_url: string;
      jewelry_type: string;
      variants: JewelryVariant[];
      detections?: any;
      metrics?: any;
    };
  };
  error?: any;
}

export interface JewelryTypes {
  jewelry_types: string[];
  metal_colors: string[];
  styles: string[];
  gem_colors: string[];
}

/**
 * Submit jewelry try-on request
 */
export async function submitJewelryTryOn(params: JewelryTryOnParams): Promise<JewelryTaskResult> {
  const response = await fetch(`${API_BASE_URL}/api/jewelry/tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to submit jewelry try-on');
  }
  
  return response.json();
}

/**
 * Get task status
 */
export async function getJewelryTaskStatus(taskId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/jewelry/status/${taskId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get task status');
  }
  
  return response.json();
}

/**
 * Get supported jewelry types
 */
export async function getJewelryTypes(): Promise<JewelryTypes> {
  const response = await fetch(`${API_BASE_URL}/api/jewelry/types`);
  
  if (!response.ok) {
    throw new Error('Failed to get jewelry types');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Calculate ring size from finger circumference
 */
export async function calculateRingSize(fingerCircumferenceMm: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/jewelry/calculate-ring-size`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ finger_circumference_mm: fingerCircumferenceMm }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to calculate ring size');
  }
  
  return response.json();
}

/**
 * Poll for task completion
 */
export async function pollForResult(
  taskId: string, 
  onProgress?: (progress: number) => void,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<JewelryTaskResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getJewelryTaskStatus(taskId);
    
    if (result.data?.task_status === 'success') {
      return result.data;
    }
    
    if (result.data?.task_status === 'failed') {
      throw new Error('Task failed');
    }
    
    if (onProgress && result.data?.progress) {
      onProgress(result.data.progress);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Task polling timed out');
}
