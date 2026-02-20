/**
 * API Client - TypeScript typed API client for Closet AI
 * 
 * Provides typed endpoints for:
 * - User authentication & profile
 * - Upload & generation
 * - Credits & billing
 * - Jobs & results
 * 
 * @module services/api
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  credits: number;
  tenantId?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  input: { sourceKey?: string; sourceUrl?: string };
  output?: { resultUrl?: string; thumbnails?: Array<{ size: string; url: string }> };
  creditsUsed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditEstimate {
  credits: number;
  breakdown: string[];
  jobType: string;
  estimatedDuration?: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  estimatedCredits: number;
  estimatedDuration?: number;
}

export interface FeedbackPayload {
  rating: number;
  tags?: string[];
  comment?: string;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ========================================================================
  // Auth
  // ========================================================================

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data } = await this.client.post('/api/auth/login', { email, password });
    return data;
  }

  async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    const { data } = await this.client.post('/api/auth/register', { email, password, name });
    return data;
  }

  async getProfile(): Promise<User> {
    const { data } = await this.client.get('/api/user/profile');
    return data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await this.client.put('/api/user/profile', updates);
    return data;
  }

  // ========================================================================
  // Credits
  // ========================================================================

  async getCredits(): Promise<{ available: number; reserved: number; spent: number }> {
    const { data } = await this.client.get('/api/credits');
    return data;
  }

  async purchaseCredits(amount: number, paymentMethodId: string): Promise<{ transactionId: string }> {
    const { data } = await this.client.post('/api/credits/purchase', { amount, paymentMethodId });
    return data;
  }

  async estimateCost(jobType: string, params?: Record<string, unknown>): Promise<CreditEstimate> {
    const { data } = await this.client.post('/api/gen/estimate', { jobType, params });
    return data;
  }

  // ========================================================================
  // Upload
  // ========================================================================

  async getUploadUrl(filename: string, contentType: string): Promise<UploadUrlResponse> {
    const { data } = await this.client.post('/api/upload-url', { filename, contentType });
    return data;
  }

  async uploadToSignedUrl(url: string, file: Blob | File, contentType: string): Promise<void> {
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
  }

  // ========================================================================
  // Jobs
  // ========================================================================

  async createJob(params: {
    jobType: string;
    sourceKey: string;
    params?: Record<string, unknown>;
  }): Promise<CreateJobResponse> {
    const { data } = await this.client.post('/api/gen', params);
    return data;
  }

  async getJob(jobId: string): Promise<Job> {
    const { data } = await this.client.get(`/api/gen/job/${jobId}`);
    return data;
  }

  async getJobs(options?: { limit?: number; status?: string }): Promise<Job[]> {
    const { data } = await this.client.get('/api/gen/jobs', { params: options });
    return data;
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.client.post(`/api/gen/job/${jobId}/cancel`);
  }

  // ========================================================================
  // Feedback
  // ========================================================================

  async submitFeedback(jobId: string, feedback: FeedbackPayload): Promise<void> {
    await this.client.post(`/api/gen/job/${jobId}/feedback`, feedback);
  }

  // ========================================================================
  // Consent
  // ========================================================================

  async submitConsent(consent: { version: string; categories: string[] }): Promise<void> {
    await this.client.post('/api/user/consent', consent);
  }

  async getConsent(): Promise<{ version: string; categories: string[]; grantedAt: string }> {
    const { data } = await this.client.get('/api/user/consent');
    return data;
  }
}

// ============================================================================
// Singleton
// ============================================================================

export const api = new ApiClient();
export default api;
