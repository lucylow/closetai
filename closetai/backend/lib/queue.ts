/**
 * Queue Module - BullMQ Queue Management
 * 
 * Provides job queue functionality using BullMQ for:
 * - Async job processing
 * - Job prioritization
 * - Retry handling with exponential backoff
 * - Dead letter queue for failed jobs
 * - Job progress tracking
 * 
 * Environment variables:
 * - REDIS_HOST: Redis host
 * - REDIS_PORT: Redis port
 * - REDIS_PASSWORD: Redis password (optional)
 * 
 * @module queue
 */

import Queue, { 
  JobsOptions, 
  WorkerOptions,
  Job,
} from 'bullmq';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * Job types supported by the queue
 */
export type QueueJobType = 
  | 'skin_analysis'
  | 'hair_color'
  | 'hair_style'
  | 'makeup_tryon'
  | 'jewelry_tryon'
  | 'accessories_tryon'
  | 'text_to_image'
  | 'image_edit'
  | 'aging'
  | 'thumbnail_generation'
  | 'export';

/**
 * Job data structure
 */
export interface QueueJobData {
  jobId: string;
  userId: string;
  tenantId?: string;
  type: QueueJobType;
  input: {
    sourceKey?: string;
    sourceUrl?: string;
    sourceBase64?: string;
    params?: Record<string, unknown>;
  };
  options?: {
    priority?: number;
    retryAttempts?: number;
    timeout?: number;
  };
}

/**
 * Job result structure
 */
export interface QueueJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'cancelled';
  result?: {
    outputKey?: string;
    outputUrl?: string;
    outputBase64?: string;
    thumbnails?: Array<{ size: string; key: string; url: string }>;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  creditsUsed?: number;
  completedAt: string;
}

/**
 * Job progress information
 */
export interface JobProgress {
  jobId: string;
  status: string;
  progress: number;
  phase?: string;
  thumbnailUrl?: string;
  eta?: number;
  message?: string;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    tls?: { rejectUnauthorized: boolean };
  };
  defaultJobOptions: JobsOptions;
  workerOptions: WorkerOptions;
}

// ============================================================================
// Configuration
// ============================================================================

function getQueueConfig(): QueueConfig {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  return {
    connection: {
      host,
      port,
      password: password || undefined,
      tls: process.env.REDIS_TLS === 'true' 
        ? { rejectUnauthorized: false } 
        : undefined,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 3600,
      },
      removeOnFail: {
        count: 500,
        age: 7 * 24 * 3600,
      },
    },
    workerOptions: {
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  };
}

// ============================================================================
// Queue Instances
// ============================================================================

let generationQueue: Queue | null = null;
let priorityQueue: Queue | null = null;
let deadLetterQueue: Queue | null = null;

export function getGenerationQueue(): Queue {
  if (!generationQueue) {
    const config = getQueueConfig();
    generationQueue = new Queue('generation', {
      connection: config.connection,
      defaultJobOptions: config.defaultJobOptions,
    });
    console.log('[Queue] Generation queue initialized');
  }
  return generationQueue;
}

export function getPriorityQueue(): Queue {
  if (!priorityQueue) {
    const config = getQueueConfig();
    priorityQueue = new Queue('generation:priority', {
      connection: config.connection,
      defaultJobOptions: {
        ...config.defaultJobOptions,
        priority: 1,
      },
    });
    console.log('[Queue] Priority queue initialized');
  }
  return priorityQueue;
}

export function getDeadLetterQueue(): Queue {
  if (!deadLetterQueue) {
    const config = getQueueConfig();
    deadLetterQueue = new Queue('generation:dlq', {
      connection: config.connection,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
    console.log('[Queue] Dead letter queue initialized');
  }
  return deadLetterQueue;
}

export function resetQueues(): void {
  if (generationQueue) {
    generationQueue.close();
    generationQueue = null;
  }
  if (priorityQueue) {
    priorityQueue.close();
    priorityQueue = null;
  }
  if (deadLetterQueue) {
    deadLetterQueue.close();
    deadLetterQueue = null;
  }
}

// ============================================================================
// Job Management
// ============================================================================

export async function addJob(
  data: QueueJobData,
  options?: JobsOptions
): Promise<string> {
  const queue = data.options?.priority 
    ? getPriorityQueue() 
    : getGenerationQueue();

  const jobId = data.jobId || randomUUID();

  const jobOptions: JobsOptions = {
    jobId,
    priority: data.options?.priority,
    attempts: data.options?.retryAttempts,
    timeout: data.options?.timeout,
  };

  await queue.add(data.type, data, { ...jobOptions, ...options });
  
  console.log(`[Queue] Added job ${jobId} of type ${data.type}`);
  
  return jobId;
}

export async function getJobStatus(jobId: string): Promise<JobProgress | null> {
  const queue = getGenerationQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as JobProgress || { jobId, progress: 0, status: state || 'unknown' };

  return {
    jobId: job.id || jobId,
    status: state || 'unknown',
    progress: typeof progress.progress === 'number' ? progress.progress : 0,
    phase: progress.phase,
    thumbnailUrl: progress.thumbnailUrl,
    eta: progress.eta,
    message: progress.message,
  };
}

export async function updateJobProgress(
  jobId: string,
  progress: Partial<JobProgress>
): Promise<void> {
  const queue = getGenerationQueue();
  const job = await queue.getJob(jobId);
  
  if (job) {
    await job.update(progress);
  }
}

export async function retryJob(jobId: string): Promise<void> {
  const queue = getGenerationQueue();
  const job = await queue.getJob(jobId);
  
  if (job) {
    await job.retry();
    console.log(`[Queue] Retrying job ${jobId}`);
  }
}

export async function removeJob(jobId: string): Promise<void> {
  const queue = getGenerationQueue();
  const job = await queue.getJob(jobId);
  
  if (job) {
    await job.remove();
    console.log(`[Queue] Removed job ${jobId}`);
  }
}

export async function getJobsInQueue(): Promise<number> {
  const queue = getGenerationQueue();
  const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
  return counts.waiting + counts.active + counts.delayed;
}

export async function getWorkerStats(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
}> {
  const queue = getGenerationQueue();
  const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed');
  return counts as { active: number; waiting: number; completed: number; failed: number };
}

export default {
  getGenerationQueue,
  getPriorityQueue,
  getDeadLetterQueue,
  resetQueues,
  addJob,
  getJobStatus,
  updateJobProgress,
  retryJob,
  removeJob,
  getJobsInQueue,
  getWorkerStats,
};
