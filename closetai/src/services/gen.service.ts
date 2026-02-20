/**
 * Generation Service - Frontend API client for generative AI
 */
import axios from 'axios';

const API_BASE = '/api/gen';

interface Text2ImgRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
  template?: string;
}

interface ImageEditRequest {
  imageKey: string;
  prompt: string;
  maskKey?: string;
  style?: string;
}

interface TryonRequest {
  personImageKey: string;
  itemImageKey: string;
  category?: string;
  fit?: string;
}

interface BatchRequest {
  jobs: Array<{
    prompt: string;
    style?: string;
  }>;
  template?: string;
}

interface JobStatus {
  id: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  prompt?: string;
  metadata?: Record<string, unknown>;
  resultUrl?: string;
  inputKey?: string;
  style?: string;
  width?: number;
  height?: number;
  creditsUsed?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface JobList {
  jobs: JobStatus[];
  total: number;
  limit: number;
  offset: number;
}

interface UploadUrlResponse {
  key: string;
  uploadUrl: string;
  expiresIn: number;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
  defaults: Record<string, unknown>;
}

interface SavedPrompt {
  id: string;
  prompt: string;
  negative_prompt?: string;
  template?: string;
  style?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Create text-to-image generation job
 */
export async function createText2Img(request: Text2ImgRequest): Promise<{ jobId: string; status: string }> {
  const token = getAuthToken();
  const response = await axios.post(`${API_BASE}/text2img`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Create image edit job
 */
export async function createImageEdit(request: ImageEditRequest): Promise<{ jobId: string; status: string }> {
  const token = getAuthToken();
  const response = await axios.post(`${API_BASE}/edit`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Create virtual try-on job
 */
export async function createTryon(request: TryonRequest): Promise<{ jobId: string; status: string }> {
  const token = getAuthToken();
  const response = await axios.post(`${API_BASE}/tryon`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Create batch generation job
 */
export async function createBatch(request: BatchRequest): Promise<{ jobId: string; status: string; jobCount: number }> {
  const token = getAuthToken();
  const response = await axios.post(`${API_BASE}/batch`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const token = getAuthToken();
  const response = await axios.get(`${API_BASE}/job/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * List user's jobs
 */
export async function listJobs(options?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<JobList> {
  const token = getAuthToken();
  const response = await axios.get(`${API_BASE}/jobs`, {
    params: options,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const token = getAuthToken();
  await axios.delete(`${API_BASE}/job/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Get signed URL for direct upload
 */
export async function getUploadUrl(
  filename: string,
  contentType: string = 'image/jpeg',
  folder: string = 'uploads'
): Promise<UploadUrlResponse> {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_BASE}/upload-url`,
    { filename, contentType, folder },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Upload file to signed URL
 */
export async function uploadToSignedUrl(
  file: File,
  signedUrl: string,
  contentType: string
): Promise<void> {
  await axios.put(signedUrl, file, {
    headers: {
      'Content-Type': contentType,
    },
  });
}

/**
 * Get signed URL for download
 */
export async function getDownloadUrl(key: string, expires: number = 3600): Promise<{ url: string; expiresIn: number }> {
  const token = getAuthToken();
  const response = await axios.get(`${API_BASE}/download/${key}`, {
    params: { expires },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Save prompt template
 */
export async function savePrompt(prompt: {
  prompt: string;
  negativePrompt?: string;
  template?: string;
  style?: string;
  isPublic?: boolean;
}): Promise<{ id: string }> {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_BASE}/prompts`,
    prompt,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * List saved prompts
 */
export async function listPrompts(options?: {
  template?: string;
  limit?: number;
  offset?: number;
}): Promise<{ prompts: SavedPrompt[] }> {
  const token = getAuthToken();
  const response = await axios.get(`${API_BASE}/prompts`, {
    params: options,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Poll job status until completed or failed
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (status: JobStatus) => void,
  interval: number = 2000,
  maxAttempts: number = 120
): Promise<JobStatus> {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === 'completed') {
          resolve(status);
          return;
        }
        
        if (status.status === 'failed') {
          reject(new Error(status.errorMessage || 'Generation failed'));
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Job polling timeout'));
          return;
        }
        
        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };
    
    poll();
  });
}

export type {
  Text2ImgRequest,
  ImageEditRequest,
  TryonRequest,
  BatchRequest,
  JobStatus,
  JobList,
  UploadUrlResponse,
  PromptTemplate,
  SavedPrompt,
};
