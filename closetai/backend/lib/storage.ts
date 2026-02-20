/**
 * Storage Helper for S3/Linode Object Storage
 * 
 * Provides utilities for:
 * - Signed URL generation for uploads/downloads
 * - Buffer and stream uploads
 * - Key management with tenant isolation
 * - TTL and lifecycle policy utilities
 * 
 * @module lib/storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for Linode/other S3-compatible storage
});

const BUCKET = process.env.S3_BUCKET || 'closetai-media';
const DEFAULT_RETENTION_DAYS = parseInt(process.env.DEFAULT_RETENTION_DAYS || '30', 10);

/**
 * Generate a signed PUT URL for direct client uploads
 * 
 * @param key - S3 object key
 * @param contentType - MIME type of the content
 * @param expiresIn - URL expiration in seconds (default: 300)
 * @returns Signed URL for PUT request
 */
export async function getSignedPutUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a signed GET URL for downloading objects
 * 
 * @param key - S3 object key
 * @param expiresIn - URL expiration in seconds (default: 3600)
 * @returns Signed URL for GET request
 */
export async function getSignedGetUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload a buffer to S3
 * 
 * @param key - S3 object key
 * @param body - Buffer to upload
 * @param contentType - MIME type of the content
 * @param metadata - Optional metadata
 * @returns Upload result
 */
export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });
  
  await s3Client.send(command);
}

/**
 * Upload a ReadableStream to S3
 * 
 * @param key - S3 object key
 * @param stream - Readable stream to upload
 * @param contentType - MIME type of the content
 * @param contentLength - Size of the stream
 * @returns Upload result
 */
export async function uploadStream(
  key: string,
  stream: NodeJS.ReadableStream,
  contentType: string,
  contentLength?: number
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: stream as any,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  
  await s3Client.send(command);
}

/**
 * Delete an object from S3
 * 
 * @param key - S3 object key to delete
 */
export async function deleteKey(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  await s3Client.send(command);
}

/**
 * Download an object from S3
 * 
 * @param key - S3 object key
 * @returns Object as Buffer
 */
export async function downloadBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('Empty response body');
  }
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * List objects with a prefix
 * 
 * @param prefix - Key prefix to filter objects
 * @param maxKeys - Maximum number of objects to return
 * @returns List of object keys
 */
export async function listObjects(
  prefix: string,
  maxKeys: number = 1000
): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });
  
  const response = await s3Client.send(command);
  
  return (response.Contents || []).map(obj => obj.Key || '').filter(Boolean);
}

// Key generation utilities

/**
 * Generate a user-specific storage key
 * 
 * @param userId - User ID
 * @param filename - Original filename
 * @returns S3 key for user file
 */
export function userKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Generate a tenant-specific storage key
 * 
 * @param tenantId - Tenant ID
 * @param type - Type of content (images, models, etc.)
 * @param filename - Original filename
 * @returns S3 key for tenant file
 */
export function tenantKey(tenantId: string, type: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `tenants/${tenantId}/${type}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Generate a job-specific storage key
 * 
 * @param jobId - Job ID
 * @param type - Type of output (tryon, makeup, etc.)
 * @param filename - Output filename
 * @returns S3 key for job output
 */
export function jobKey(jobId: string, type: string, filename: string): string {
  return `jobs/${jobId}/${type}/${filename}`;
}

/**
 * Generate a research/experiment storage key
 * 
 * @param experimentId - Experiment ID
 * @param runId - Run ID
 * @param filename - Output filename
 * @returns S3 key for experiment output
 */
export function experimentKey(experimentId: string, runId: string, filename: string): string {
  return `experiments/${experimentId}/${runId}/${filename}`;
}

// Lifecycle and retention utilities

/**
 * Get object metadata including creation date
 * 
 * @param key - S3 object key
 * @returns Object metadata
 */
export async function getObjectMetadata(key: string): Promise<{
  size?: number;
  lastModified?: Date;
  contentType?: string;
}> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  
  return {
    size: response.ContentLength,
    lastModified: response.LastModified,
    contentType: response.ContentType,
  };
}

/**
 * Calculate days since object creation
 * 
 * @param lastModified - Object last modified date
 * @returns Number of days since creation
 */
export function daysSinceCreation(lastModified?: Date): number {
  if (!lastModified) return 0;
  const now = new Date();
  const diff = now.getTime() - lastModified.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if object should be purged based on retention policy
 * 
 * @param lastModified - Object last modified date
 * @param retentionDays - Retention period in days
 * @returns Whether object should be purged
 */
export function shouldPurge(lastModified?: Date, retentionDays: number = DEFAULT_RETENTION_DAYS): boolean {
  return daysSinceCreation(lastModified) > retentionDays;
}

/**
 * Get presigned URL for batch operations
 * 
 * @param keys - Array of keys to generate URLs for
 * @param expiresIn - URL expiration in seconds
 * @returns Map of key to signed URL
 */
export async function getBatchSignedUrls(
  keys: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  
  for (const key of keys) {
    const url = await getSignedGetUrl(key, expiresIn);
    urlMap.set(key, url);
  }
  
  return urlMap;
}

export default {
  s3Client,
  getSignedPutUrl,
  getSignedGetUrl,
  uploadBuffer,
  uploadStream,
  deleteKey,
  downloadBuffer,
  listObjects,
  userKey,
  tenantKey,
  jobKey,
  experimentKey,
  getObjectMetadata,
  daysSinceCreation,
  shouldPurge,
  getBatchSignedUrls,
};
