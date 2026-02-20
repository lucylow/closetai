/**
 * Perfect Corp service: VTON, text-to-image, measurements.
 * Includes caching (avoid burning hackathon credits), preprocessing, retries, credit-aware errors.
 */
const crypto = require('crypto');
const FormData = require('form-data');
const sharp = require('sharp');
const NodeCache = require('node-cache');
const { postFormWithRetry, postJsonWithRetry } = require('../lib/perfectCorpClient');
const env = require('../config/env');
const linodeService = require('./linode.service');

const cache = new NodeCache({ stdTTL: 60 * 60 * 6 }); // 6h TTL for VTON results

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

class PerfectCorpService {
  constructor() {
    this.base = env.perfectCorp?.baseUrl || 'https://yce-api-01.makeupar.com';
    this.apiKey = env.perfectCorp?.apiKey;
  }

  /**
   * Preprocess images: resize, convert to PNG for consistent API input.
   */
  async preprocessImageToPNG(inputBuffer, { maxWidth = 1200 } = {}) {
    let img = sharp(inputBuffer).rotate();
    const metadata = await img.metadata();
    if (metadata.width && metadata.width > maxWidth) {
      img = img.resize({ width: maxWidth });
    }
    return img.png({ quality: 90 }).toBuffer();
  }

  /**
   * Virtual try-on: composite garment onto model photo.
   * Uses caching to avoid double-charges for identical inputs.
   */
  async virtualTryOn(modelImageBuffer, garmentImageBuffer, category = 'top', fit = 'standard') {
    if (!this.apiKey) {
      return modelImageBuffer;
    }

    const options = { category, fit };
    const [modelPng, garmentPng] = await Promise.all([
      this.preprocessImageToPNG(modelImageBuffer, { maxWidth: 1400 }),
      this.preprocessImageToPNG(garmentImageBuffer, { maxWidth: 1200 }),
    ]);

    const key = `vton:${sha256(Buffer.concat([modelPng, garmentPng, Buffer.from(JSON.stringify(options))]))}`;
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const form = new FormData();
    form.append('model_image', modelPng, { filename: 'model.png' });
    form.append('garment_image', garmentPng, { filename: 'garment.png' });
    form.append('category', options.category);
    form.append('fit', options.fit);

    try {
      const resp = await postFormWithRetry('/vton', form, { responseType: 'arraybuffer' });
      const imgBuf = Buffer.from(resp.data);
      cache.set(key, imgBuf, 60 * 60 * 24); // 24h cache
      return imgBuf;
    } catch (err) {
      if (err?.response?.status === 402) {
        const credits = err.response.headers['x-credit-count'] || 'unknown';
        const e = new Error(`Perfect Corp credits exhausted (X-Credit-Count=${credits})`);
        e.code = 'PERFECTCREDITS';
        e.statusCode = 402;
        throw e;
      }
      throw err;
    }
  }

  async virtualTryOnMulti(modelImageBuffer, garmentBuffers, categories) {
    let currentImage = modelImageBuffer;
    for (let i = 0; i < garmentBuffers.length; i++) {
      currentImage = await this.virtualTryOn(
        currentImage,
        garmentBuffers[i],
        categories[i] || 'top'
      );
    }
    return currentImage;
  }

  /**
   * Body measurement approximation from user photo.
   */
  async estimateMeasurements(imageBuffer) {
    if (!this.apiKey) {
      return {
        height: 170,
        weight: 65,
        bust: 88,
        chest: 90,
        waist: 72,
        hips: 95,
        shoulder: 42,
        inseam: 78,
      };
    }
    try {
      const form = new FormData();
      form.append('image', imageBuffer, { filename: 'user.jpg' });
      const resp = await postFormWithRetry('/measure', form, { responseType: 'json' });
      return resp.data;
    } catch {
      return {
        height: 170,
        weight: 65,
        bust: 88,
        chest: 90,
        waist: 72,
        hips: 95,
        shoulder: 42,
        inseam: 78,
      };
    }
  }

  /**
   * Generate fashion image from text prompt (Perfect Corp text-to-image).
   */
  async generateImage(prompt, style = 'photorealistic') {
    if (!this.apiKey) {
      return this._generatePlaceholderImage(prompt, style);
    }
    try {
      const body = {
        prompt: `Fashion photography, ${prompt}, ${style} style, high quality`,
        style,
        num_images: 1,
        size: '1024x1024',
      };
      const resp = await postJsonWithRetry('/generate', body, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const ct = resp.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        return JSON.parse(Buffer.from(resp.data).toString('utf8'));
      }
      return Buffer.from(resp.data);
    } catch (e) {
      if (e?.response?.status === 402) {
        const err = new Error('Out of API credits. Please try again later.');
        err.code = 'PERFECTCREDITS';
        err.statusCode = 402;
        throw err;
      }
      return this._generatePlaceholderImage(prompt, style);
    }
  }

  async _generatePlaceholderImage(prompt, style) {
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#f5f0fa"/>
        <text x="256" y="240" font-family="sans-serif" font-size="20" fill="#7c3aed" text-anchor="middle">${String(prompt || 'AI Styled').slice(0, 35).replace(/[<>"&]/g, '')}</text>
        <text x="256" y="270" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">${style}</text>
        <text x="256" y="300" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">Add YOUCAM_API_KEY for real generation</text>
      </svg>
    `;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Upload try-on result to storage and return shareable URL.
   */
  async createShareableResult(imageBuffer, filenamePrefix = 'tryon') {
    const fileName = `${filenamePrefix}_${Date.now()}.png`;
    const { url, key } = await linodeService.uploadFile(
      imageBuffer,
      fileName,
      'shared',
      filenamePrefix === 'ai_gen' ? 'generated' : 'tryon'
    );
    const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || '';
    const shareUrl = url.startsWith('http') ? url : (baseUrl ? `${baseUrl.replace(/\/$/, '')}${url}` : url);
    return { url: shareUrl, key, expiresAt: Date.now() + 86400000 };
  }
}

module.exports = new PerfectCorpService();
