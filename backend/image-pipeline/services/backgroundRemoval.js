/**
 * Background removal service using remove.bg API.
 * Returns PNG with transparency when successful; falls back to original on failure.
 */
const axios = require('axios');
const FormData = require('form-data');

class BackgroundRemovalService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.remove.bg/v1.0/removebg';
  }

  /**
   * Remove background from an image.
   * @param {Buffer} imageBuffer - Raw image data
   * @param {string} imageFormat - 'jpg', 'png', 'webp', etc.
   * @returns {Promise<Buffer>} Processed image (PNG with transparency)
   */
  async removeBackground(imageBuffer, imageFormat = 'jpg') {
    if (!this.apiKey) {
      return imageBuffer;
    }

    const form = new FormData();
    form.append('image_file', imageBuffer, {
      filename: `image.${imageFormat}`,
      contentType: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`,
    });
    form.append('size', 'auto');
    form.append('format', 'png');

    try {
      const response = await axios.post(this.endpoint, form, {
        headers: {
          ...form.getHeaders(),
          'X-Api-Key': this.apiKey,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      const msg = error.response?.data
        ? Buffer.isBuffer(error.response.data)
          ? error.response.data.toString()
          : JSON.stringify(error.response.data)
        : error.message;
      console.warn('Background removal failed:', msg);
      throw new Error('Background removal service error');
    }
  }
}

module.exports = BackgroundRemovalService;
