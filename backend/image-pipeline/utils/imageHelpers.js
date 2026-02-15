/**
 * Image validation and manipulation utilities.
 * Uses sharp for resizing and file-type for buffer validation.
 */
const sharp = require('sharp');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validate image buffer by magic bytes (not just extension).
 * @param {Buffer} buffer - Raw image data
 * @param {string} originalName - Original filename (for fallback)
 * @returns {Promise<{valid: boolean, error?: string, mime?: string, extension?: string}>}
 */
async function validateImage(buffer, originalName = '') {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty image data' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `Image too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)` };
  }

  const { fileTypeFromBuffer } = await import('file-type');
  const type = await fileTypeFromBuffer(buffer);
  const mime = type?.mime;
  const extension = type?.ext;

  if (!mime || !ALLOWED_MIME_TYPES.includes(mime)) {
    return { valid: false, error: `Unsupported image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  return { valid: true, mime, extension };
}

/**
 * Resize image to fit within max dimension while preserving aspect ratio.
 * @param {Buffer} buffer - Image buffer
 * @param {number} maxDimension - Max width or height
 * @returns {Promise<Buffer>}
 */
async function resize(buffer, maxDimension = 1024) {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (metadata.width <= maxDimension && metadata.height <= maxDimension) {
    return buffer;
  }

  return image
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
}

/**
 * Get image metadata (dimensions, format).
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>}
 */
async function getMetadata(buffer) {
  return sharp(buffer).metadata();
}

module.exports = { validateImage, resize, getMetadata, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
