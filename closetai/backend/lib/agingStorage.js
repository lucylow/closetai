/**
 * Aging Storage Helper - S3 operations specific to AI Aging features
 * Provides tenant-aware storage with aging-specific key management
 */

const storage = require('./storage');

const AGING_BUCKET_PREFIX = 'aging';

/**
 * Generate user-specific aging storage key
 * @param {string} userId - User UUID
 * @param {string} relativePath - File path within user aging namespace
 * @returns {string} S3 key like aging/user/{userId}/{path}
 */
function userKey(userId, relativePath) {
  if (!userId) throw new Error('userId required for userKey');
  return `${AGING_BUCKET_PREFIX}/user/${userId}/${relativePath}`;
}

/**
 * Generate brand-specific aging storage key
 * @param {string} brandId - Brand/Tenant UUID
 * @param {string} relativePath - File path within brand aging namespace
 * @returns {string} S3 key like aging/brand/{brandId}/{path}
 */
function brandKey(brandId, relativePath) {
  if (!brandId) throw new Error('brandId required for brandKey');
  return `${AGING_BUCKET_PREFIX}/brand/${brandId}/${relativePath}`;
}

/**
 * Get signed PUT URL for aging uploads
 * @param {string} userId - User UUID
 * @param {string} filename - Original filename
 * @param {number} expiresSeconds - URL expiration (default 10 minutes)
 * @param {string} contentType - MIME type
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
async function getSignedPutUrl(userId, filename, expiresSeconds = 600, contentType = 'image/jpeg') {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = userKey(userId, `uploads/${timestamp}-${safeFilename}`);
  
  const uploadUrl = storage.getSignedPutUrl(key, expiresSeconds, contentType);
  return { uploadUrl, key };
}

/**
 * Get signed GET URL for aging results
 * @param {string} key - S3 key
 * @param {number} expiresSeconds - URL expiration (default 1 hour)
 * @returns {string} Signed URL
 */
function getSignedGetUrl(key, expiresSeconds = 3600) {
  return storage.getSignedUrlForKey(key, expiresSeconds);
}

/**
 * Upload buffer for aging results
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 key
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, location: string}>}
 */
async function uploadBuffer(buffer, key, contentType = 'image/png') {
  return storage.uploadBuffer(buffer, key, contentType);
}

/**
 * Upload stream for large aging files
 * @param {stream.Readable} readableStream - Node readable stream
 * @param {string} key - S3 key
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, location: string}>}
 */
async function uploadStream(readableStream, key, contentType = 'image/png') {
  return storage.uploadStream(readableStream, key, contentType);
}

/**
 * Delete aging asset by key
 * @param {string} key - S3 key
 */
async function deleteKey(key) {
  await storage.deleteObject(key);
}

/**
 * Delete all aging assets for a user (for deletion requests)
 * @param {string} userId - User UUID
 * @param {Object} s3 - S3 client instance
 * @returns {Promise<number>} Number of deleted objects
 */
async function deleteUserAgingAssets(userId, s3) {
  const prefix = userKey(userId, '');
  const bucket = process.env.S3_BUCKET || 'closetai-media';
  
  let deletedCount = 0;
  let continuationToken = null;
  
  do {
    const listParams = {
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken
    };
    
    const listed = await s3.listObjectsV2(listParams).promise();
    
    if (listed.Contents && listed.Contents.length > 0) {
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: listed.Contents.map(obj => ({ Key: obj.Key }))
        }
      };
      
      await s3.deleteObjects(deleteParams).promise();
      deletedCount += listed.Contents.length;
    }
    
    continuationToken = listed.NextContinuationToken;
  } while (continuationToken);
  
  return deletedCount;
}

/**
 * Get aging job result key pattern
 * @param {string} jobId - Job UUID
 * @param {string} type - Result type (overlay, simulation, report)
 * @returns {string} S3 key
 */
function jobResultKey(jobId, type) {
  return `${AGING_BUCKET_PREFIX}/results/${jobId}/${type}`;
}

/**
 * Generate overlay key for aging analysis
 * @param {string} jobId - Job UUID
 * @param {string} metric - Metric name (wrinkle, pore, pigment, etc.)
 * @returns {string} S3 key
 */
function overlayKey(jobId, metric) {
  return `${AGING_BUCKET_PREFIX}/overlays/${jobId}/${metric}.png`;
}

/**
 * Generate simulation result key
 * @param {string} jobId - Job UUID
 * @param {number} yearsDelta - Years of aging simulation
 * @returns {string} S3 key
 */
function simulationKey(jobId, yearsDelta) {
  const direction = yearsDelta > 0 ? 'older' : 'younger';
  return `${AGING_BUCKET_PREFIX}/simulations/${jobId}/${direction}_${Math.abs(yearsDelta)}y.png`;
}

module.exports = {
  userKey,
  brandKey,
  getSignedPutUrl,
  getSignedGetUrl,
  uploadBuffer,
  uploadStream,
  deleteKey,
  deleteUserAgingAssets,
  jobResultKey,
  overlayKey,
  simulationKey
};
