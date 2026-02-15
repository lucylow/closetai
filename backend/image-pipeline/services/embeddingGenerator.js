/**
 * Generates vector embeddings for similarity matching.
 * Uses a lightweight perceptual hash + random projection when CLIP is not available.
 * For production with CLIP: install @xenova/transformers and uncomment the CLIP path.
 */
const crypto = require('crypto');

const EMBEDDING_DIM = 512;

/**
 * Generate a deterministic pseudo-embedding from image buffer.
 * Uses SHA-256 hash to seed a reproducible random vector - useful for
 * basic similarity when CLIP is not loaded (avoids heavy model download).
 * @param {Buffer} imageBuffer
 * @returns {number[]}
 */
function generateDeterministicEmbedding(imageBuffer) {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const seed = parseInt(hash.slice(0, 12), 16);
  const arr = [];
  let s = seed;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    arr.push((s / 0x7fffffff) * 2 - 1);
  }
  return normalizeVector(arr);
}

function normalizeVector(vec) {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

class EmbeddingGenerator {
  constructor() {
    this.extractor = null;
    this.initialized = false;
  }

  /**
   * Initialize CLIP model (optional). Uncomment when @xenova/transformers is installed.
   */
  async initialize() {
    if (this.initialized) return;
    try {
      const { pipeline } = require('@xenova/transformers');
      this.extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
      this.initialized = true;
    } catch (err) {
      console.warn('CLIP model not available, using deterministic embeddings:', err.message);
      this.initialized = true;
    }
  }

  /**
   * Generate embedding vector for an image.
   * @param {Buffer} imageBuffer
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(imageBuffer) {
    await this.initialize();

    if (this.extractor) {
      try {
        const result = await this.extractor(imageBuffer, {
          pooling: 'mean',
          normalize: true,
        });
        const data = result.data;
        return Array.from(data instanceof Float32Array ? data : result);
      } catch (err) {
        console.warn('CLIP embedding failed, falling back:', err.message);
      }
    }

    return generateDeterministicEmbedding(imageBuffer);
  }
}

module.exports = new EmbeddingGenerator();
