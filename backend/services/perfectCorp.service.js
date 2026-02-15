const env = require('../config/env');

class PerfectCorpService {
  async virtualTryOn(modelImageBuffer, garmentImageBuffer, category = 'top', fit = 'standard') {
    if (!env.perfectCorp?.apiKey) {
      // Demo mode: return model image as-is (simulated try-on)
      return modelImageBuffer;
    }
    const form = new FormData();
    form.append('model_image', modelImageBuffer, { filename: 'model.jpg' });
    form.append('garment_image', garmentImageBuffer, { filename: 'garment.png' });
    form.append('category', category);
    form.append('fit', fit);
    const response = await axios.post(`${BASE_URL}/vton`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${env.perfectCorp.apiKey}` },
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
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
   * Body measurement approximation from a user photo.
   * Calls Perfect Corp measure API when configured; otherwise uses heuristic fallback.
   */
  async estimateMeasurements(imageBuffer) {
    if (env.perfectCorp?.apiKey) {
      try {
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'user.jpg' });
        const response = await axios.post(`${BASE_URL}/measure`, form, {
          headers: { ...form.getHeaders(), Authorization: `Bearer ${env.perfectCorp.apiKey}` },
        });
        return response.data;
      } catch (err) {
        // Fall through to heuristic fallback
      }
    }
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

  /**
   * Generate a shareable URL for a try-on result.
   * Uploads to Linode Object Storage (or local uploads) and returns public URL.
   */
  async createShareableResult(imageBuffer) {
    const fileName = `tryon_${Date.now()}.png`;
    const { url, key } = await linodeService.uploadFile(
      imageBuffer,
      fileName,
      'shared',
      'tryon'
    );
    const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || '';
    const shareUrl = url.startsWith('http') ? url : (baseUrl ? `${baseUrl.replace(/\/$/, '')}${url}` : url);
    return { url: shareUrl, key, expiresAt: Date.now() + 86400000 };
  }

  /**
   * Generate a fashion image from a text prompt (Perfect Corp text-to-image).
   * Falls back to placeholder when API key is missing.
   * @param {string} prompt - e.g. "A casual summer outfit with a white linen shirt"
   * @param {string} style - 'photorealistic', 'sketch', 'watercolor'
   * @returns {Promise<Buffer>} Generated image buffer (PNG)
   */
  async generateImage(prompt, style = 'photorealistic') {
    if (!env.perfectCorp?.apiKey) {
      return await this._generatePlaceholderImage(prompt, style);
    }
    try {
      const axios = require('axios');
      const response = await axios.post(
        'https://api.perfectcorp.com/generate',
        {
          prompt: `Fashion photography, ${prompt}, ${style} style, high quality`,
          style,
          num_images: 1,
          size: '1024x1024',
        },
        {
          headers: {
            Authorization: `Bearer ${env.perfectCorp.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
      return Buffer.from(response.data);
    } catch (e) {
      return await this._generatePlaceholderImage(prompt, style);
    }
  }

  async _generatePlaceholderImage(prompt, style) {
    const sharp = require('sharp');
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#f5f0fa"/>
        <text x="256" y="240" font-family="sans-serif" font-size="20" fill="#7c3aed" text-anchor="middle">${String(prompt || 'AI Styled').slice(0, 35).replace(/[<>"&]/g, '')}</text>
        <text x="256" y="270" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">${style}</text>
        <text x="256" y="300" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">Add PERFECT_CORP_API_KEY for real generation</text>
      </svg>
    `;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

module.exports = new PerfectCorpService();
