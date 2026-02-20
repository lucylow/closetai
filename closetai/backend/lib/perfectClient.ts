/**
 * Perfect/YouCam API Client Wrapper
 * 
 * Provides safe, robust wrappers for Perfect Corp's AI services including:
 * - Virtual try-on (clothing, makeup, hair)
 * - Skin analysis
 * - Image generation
 * - Async task management with polling
 * 
 * Features:
 * - Exponential backoff with jitter
 * - 429 rate limit handling with Retry-After header respect
 * - Credit tracking per tenant
 * - Request ID propagation for tracing
 * - Type-safe API helpers
 * 
 * @module lib/perfectClient
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Redis client for credit tracking
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

// Types for Perfect API responses
export interface PerfectTaskResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    images?: Array<{
      image_id: string;
      url: string;
      type: string;
    }>;
    output_url?: string;
    output_base64?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  created_at: string;
  completed_at?: string;
}

export interface RegisterFilesResponse {
  file_ids: string[];
  uploaded_count: number;
}

export interface CreditInfo {
  remaining: number;
  used: number;
  total: number;
  reset_at?: string;
}

export interface PerfectApiError extends Error {
  status?: number;
  code?: string;
  retryAfter?: number;
  isRetryable: boolean;
}

// File types for Perfect API
export type PerfectFileType = 'person' | 'garment' | 'accessory' | 'background' | 'reference';

// Task types supported by Perfect
export type PerfectTaskType = 
  | 'tryon_cloth'
  | 'tryon_makeup'
  | 'tryon_hairstyle'
  | 'tryon_accessory'
  | 'skin_analysis'
  | 'text2img'
  | 'img2img'
  | 'background_remove'
  | 'background_replace';

/**
 * Create axios client for Perfect API
 */
function createPerfectClient(): AxiosInstance {
  const baseURL = process.env.PERFECT_BASE || 'https://yce-api-01.makeupar.com';
  const apiKey = process.env.YOUCAM_API_KEY || process.env.PERFECT_API_KEY || process.env.PERFECT_CORP_API_KEY || '';
  const timeout = parseInt(process.env.PERFECT_TIMEOUT_MS || '90000', 10);

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor for request ID
  client.interceptors.request.use((config) => {
    const requestId = uuidv4();
    config.headers['X-Request-Id'] = requestId;
    return config;
  });

  // Response interceptor for credit tracking
  client.interceptors.response.use(
    (response) => {
      const credits = response.headers['x-credit-remaining'] || response.headers['x-credits-remaining'];
      if (credits) {
        const tenantId = response.config.headers['X-Tenant-Id'];
        if (tenantId) {
          redis.set(`tenant:${tenantId}:credits`, String(credits), 'EX', 60 * 30).catch(console.error);
        }
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '0', 10);
        if (retryAfter > 0 && !originalRequest._retry) {
          originalRequest._retry = true;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return client(originalRequest);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
}

const client = createPerfectClient();

/**
 * Safe POST wrapper with exponential backoff and retry logic
 * 
 * @param path - API endpoint path
 * @param body - Request body
 * @param tenantId - Optional tenant ID for credit tracking
 * @param maxAttempts - Maximum retry attempts (default: 3)
 * @param opts - Additional axios options
 * @returns API response data
 */
export async function safePost<T = any>(
  path: string,
  body: any,
  tenantId?: string,
  maxAttempts: number = 3,
  opts?: AxiosRequestConfig
): Promise<T> {
  let attempt = 0;
  let lastErr: any;

  while (attempt < maxAttempts) {
    try {
      const config: AxiosRequestConfig = {
        ...opts,
        headers: {
          ...opts?.headers,
          ...(tenantId && { 'X-Tenant-Id': tenantId }),
        },
      };
      
      const response = await client.post<T>(path, body, config);
      
      // Track credits after successful request
      const credits = response.headers['x-credit-remaining'] || response.headers['x-credits-remaining'];
      if (tenantId && credits) {
        await redis.set(`tenant:${tenantId}:credits`, String(credits), 'EX', 60 * 30);
      }
      
      return response.data;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      
      // Don't retry on client errors (except 429)
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      
      // Handle 429 Retry-After header
      const retryAfter = parseInt(err?.response?.headers?.['retry-after'] || '0', 10);
      const backoff = retryAfter > 0 
        ? retryAfter * 1000 
        : Math.min(500 * Math.pow(2, attempt), 20000);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
      
      attempt++;
      
      // Log retry attempt
      console.log(`[PerfectClient] Retry attempt ${attempt}/${maxAttempts} for ${path} after ${backoff}ms`);
    }
  }
  
  throw lastErr;
}

/**
 * Safe GET wrapper with exponential backoff
 */
export async function safeGet<T = any>(
  path: string,
  tenantId?: string,
  maxAttempts: number = 3
): Promise<T> {
  let attempt = 0;
  let lastErr: any;

  while (attempt < maxAttempts) {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          ...(tenantId && { 'X-Tenant-Id': tenantId }),
        },
      };
      
      const response = await client.get<T>(path, config);
      return response.data;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      
      const retryAfter = parseInt(err?.response?.headers?.['retry-after'] || '0', 10);
      const backoff = retryAfter > 0 
        ? retryAfter * 1000 
        : Math.min(500 * Math.pow(2, attempt), 20000);
      
      await new Promise(resolve => setTimeout(resolve, backoff));
      attempt++;
    }
  }
  
  throw lastErr;
}

/**
 * Register files with Perfect API for processing
 * 
 * @param files - Array of file objects with type and either url or base64
 * @param tenantId - Optional tenant ID
 * @returns RegisterFilesResponse with file IDs
 */
export async function registerFiles(
  files: Array<{
    type: PerfectFileType;
    url?: string;
    base64?: string;
    name?: string;
  }>,
  tenantId?: string
): Promise<RegisterFilesResponse> {
  return safePost<RegisterFilesResponse>(
    '/api/v2/file/register',
    { files },
    tenantId
  );
}

/**
 * Start a skin analysis task
 * 
 * @param payload - Skin analysis parameters
 * @param tenantId - Optional tenant ID
 * @returns Task response with task_id
 */
export async function startSkinAnalysis(
  payload: {
    image_file_id: string;
    analysis_types?: Array<'skin_type' | 'skin_tone' | 'wrinkles' | 'pores' | 'acne' | 'spots'>;
  },
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safePost<PerfectTaskResponse>(
    '/api/v2/ai/skin/analysis',
    payload,
    tenantId
  );
}

/**
 * Start a virtual try-on task for clothing
 * 
 * @param payload - Try-on parameters (person file ID, garment file ID, options)
 * @param tenantId - Optional tenant ID
 * @returns Task response with task_id
 */
export async function startTryOnCloth(
  payload: {
    person_file_id: string;
    garment_file_id: string;
    options?: {
      fit_type?: 'loose' | 'tight' | 'auto';
      position?: 'auto' | { x: number; y: number };
      background?: 'transparent' | 'original' | 'white' | 'custom';
    };
  },
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safePost<PerfectTaskResponse>(
    '/api/v2/ai/tryon/cloth',
    payload,
    tenantId
  );
}

/**
 * Start a makeup transfer task
 * 
 * @param payload - Makeup transfer parameters
 * @param tenantId - Optional tenant ID
 * @returns Task response with task_id
 */
export async function startMakeupTransfer(
  payload: {
    person_file_id: string;
    makeup_file_id?: string;
    makeup_type?: 'lipstick' | 'eyeshadow' | 'foundation' | 'full';
    intensity?: number;
    colors?: {
      lip?: string;
      eye?: string;
      cheek?: string;
    };
  },
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safePost<PerfectTaskResponse>(
    '/api/v2/ai/tryon/makeup',
    payload,
    tenantId
  );
}

/**
 * Start a text-to-image generation task
 * 
 * @param payload - Text-to-image parameters
 * @param tenantId - Optional tenant ID
 * @returns Task response with task_id
 */
export async function startText2Img(
  payload: {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
    style?: string;
  },
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safePost<PerfectTaskResponse>(
    '/api/v2/ai/text2img',
    payload,
    tenantId
  );
}

/**
 * Start a hairstyle try-on task
 * 
 * @param payload - Hairstyle parameters
 * @param tenantId - Optional tenant ID
 * @returns Task response with task_id
 */
export async function startHairstyleTryon(
  payload: {
    person_file_id: string;
    hairstyle_file_id?: string;
    color?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  },
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safePost<PerfectTaskResponse>(
    '/api/v2/ai/tryon/hairstyle',
    payload,
    tenantId
  );
}

/**
 * Get task status by ID
 * 
 * @param taskId - Task ID to check
 * @param tenantId - Optional tenant ID
 * @returns Task status response
 */
export async function getTaskStatus(
  taskId: string,
  tenantId?: string
): Promise<PerfectTaskResponse> {
  return safeGet<PerfectTaskResponse>(
    `/api/v2/task/${taskId}/status`,
    tenantId
  );
}

/**
 * Poll task status until completion or failure
 * 
 * @param taskId - Task ID to poll
 * @param tenantId - Optional tenant ID
 * @param maxPolls - Maximum number of polls (default: 60)
 * @param intervalMs - Polling interval in ms (default: 2000)
 * @returns Final task response
 */
export async function pollTaskCompletion(
  taskId: string,
  tenantId?: string,
  maxPolls: number = 60,
  intervalMs: number = 2000
): Promise<PerfectTaskResponse> {
  let polls = 0;
  
  while (polls < maxPolls) {
    const status = await getTaskStatus(taskId, tenantId);
    
    if (status.status === 'completed') {
      return status;
    }
    
    if (status.status === 'failed') {
      throw new Error(`Task ${taskId} failed: ${status.error?.message || 'Unknown error'}`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    polls++;
  }
  
  throw new Error(`Task ${taskId} polling timeout after ${maxPolls} attempts`);
}

/**
 * Get tenant credit information
 * 
 * @param tenantId - Tenant ID
 * @returns Credit information
 */
export async function getTenantCredits(tenantId: string): Promise<CreditInfo | null> {
  const credits = await redis.get(`tenant:${tenantId}:credits`);
  if (!credits) return null;
  
  return {
    remaining: parseInt(credits, 10),
    used: 0,
    total: 0,
  };
}

/**
 * Deduct credits for a request
 * 
 * @param tenantId - Tenant ID
 * @param amount - Amount to deduct
 */
export async function deductCredits(tenantId: string, amount: number): Promise<void> {
  const key = `tenant:${tenantId}:credits`;
  const current = await redis.get(key);
  
  if (current) {
    const newValue = Math.max(0, parseInt(current, 10) - amount);
    await redis.set(key, String(newValue), 'EX', 60 * 30);
  }
}

// Export default client instance
export default client;
