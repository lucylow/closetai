/**
 * Image Processing Pipeline - Orchestrator
 * Validates uploads, removes background, extracts attributes, generates embeddings.
 */
const env = require('../config/env');
const BackgroundRemovalService = require('../image-pipeline/services/backgroundRemoval');
const attributeExtractor = require('../image-pipeline/services/attributeExtractor');
const embeddingGenerator = require('../image-pipeline/services/embeddingGenerator');
const { validateImage, resize } = require('../image-pipeline/utils/imageHelpers');

class ImageProcessingService {
  constructor() {
    this.bgRemover = new BackgroundRemovalService(env.removeBg?.apiKey);
  }

  /**
   * Remove background from image (delegates to remove.bg).
   */
  async removeBackground(imageBuffer, format = 'jpg') {
    try {
      return await this.bgRemover.removeBackground(imageBuffer, format);
    } catch (err) {
      console.warn('Background removal failed, using original:', err.message);
      return imageBuffer;
    }
  }

  /**
   * Extract attributes (color, pattern, type, brand) from image.
   */
  async extractAttributes(imageBuffer, fileName = '') {
    const raw = await attributeExtractor.extractAttributes(imageBuffer, fileName);
    return this.normalizeAttributes(raw);
  }

  /**
   * Normalize category names for consistency.
   */
  normalizeAttributes(attributes) {
    const categoryMap = {
      top: 'top', shirt: 'top', blouse: 'top', tshirt: 'top', tee: 'top',
      bottom: 'bottom', pants: 'bottom', jeans: 'bottom', trousers: 'bottom', skirt: 'bottom',
      dress: 'dress', gown: 'dress',
      outerwear: 'outerwear', jacket: 'outerwear', coat: 'outerwear', cardigan: 'outerwear',
      shoes: 'shoes', footwear: 'shoes', sneaker: 'shoes', boot: 'shoes',
      accessory: 'accessory', hat: 'accessory', cap: 'accessory', scarf: 'accessory', bag: 'accessory',
    };
    const normalized = { ...attributes };
    if (normalized.category) {
      normalized.category = categoryMap[normalized.category?.toLowerCase()] || 'other';
    }
    return normalized;
  }

  /**
   * Generate vector embedding for similarity matching.
   */
  async generateEmbedding(imageBuffer) {
    return embeddingGenerator.generateEmbedding(imageBuffer);
  }

  /**
   * Resize image to fit within max dimension.
   */
  async resizeImage(imageBuffer, maxDimension = 1024) {
    return resize(imageBuffer, maxDimension);
  }

  /**
   * Full pipeline: validate → resize → remove bg → extract attributes → generate embedding.
   * @param {Buffer} originalBuffer - Raw uploaded image
   * @param {string} originalName - Original filename
   * @returns {Promise<{processedBuffer, attributes, embedding, originalName, mimeType}>}
   */
  async processUpload(originalBuffer, originalName) {
    const validated = await validateImage(originalBuffer, originalName);
    if (!validated.valid) {
      throw new Error(validated.error);
    }

    const resizedBuffer = await resize(originalBuffer, 1024);

    let processedBuffer;
    try {
      processedBuffer = await this.removeBackground(resizedBuffer, validated.extension || 'jpg');
    } catch (bgErr) {
      processedBuffer = resizedBuffer;
    }

    const attributes = await this.extractAttributes(processedBuffer, originalName);
    const embedding = await this.generateEmbedding(processedBuffer);

    return {
      processedBuffer,
      attributes,
      embedding,
      originalName,
      mimeType: 'image/png',
    };
  }
}

module.exports = new ImageProcessingService();
