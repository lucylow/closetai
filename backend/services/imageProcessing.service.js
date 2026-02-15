const sharp = require('sharp');
const env = require('../config/env');

class ImageProcessingService {
  async removeBackground(imageBuffer, format = 'jpg') {
    if (!env.removeBg?.apiKey) {
      return imageBuffer;
    }
    try {
      const FormData = require('form-data');
      const axios = require('axios');
      const form = new FormData();
      form.append('image_file', imageBuffer, { filename: `image.${format}` });
      form.append('size', 'auto');
      form.append('format', 'png');
      const response = await require('axios').post('https://api.remove.bg/v1.0/removebg', form, {
        headers: { ...form.getHeaders(), 'X-Api-Key': env.removeBg.apiKey },
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.warn('Background removal skipped:', error.message);
      return imageBuffer;
    }
  }

  /**
   * Extracts attributes from clothing image. Uses filename hints when available.
   * In production, replace with computer vision API (e.g. Google Vision, AWS Rekognition).
   */
  async extractAttributes(imageBuffer, fileName = '') {
    const name = (fileName || '').toLowerCase();
    const categories = ['top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory'];
    const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'beige', 'navy', 'pink', 'brown'];
    const patterns = ['solid', 'striped', 'plaid', 'floral', 'print', 'knit', 'polka dot', 'geometric'];
    const styles = ['casual', 'formal', 'sporty', 'vintage', 'bohemian', 'minimalist'];

    let category = 'top';
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser')) category = 'bottom';
    else if (name.includes('dress')) category = 'dress';
    else if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot')) category = 'shoes';
    else if (name.includes('jacket') || name.includes('coat') || name.includes('cardigan')) category = 'outerwear';
    else if (name.includes('hat') || name.includes('cap') || name.includes('scarf') || name.includes('bag')) category = 'accessory';

    let color = colors[Math.floor(Math.random() * colors.length)];
    for (const c of colors) {
      if (name.includes(c)) {
        color = c;
        break;
      }
    }

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const style = styles[Math.floor(Math.random() * styles.length)];

    const raw = {
      category,
      color,
      pattern,
      style,
      confidence: 0.85 + Math.random() * 0.1,
      detected: {
        hasSleeves: Math.random() > 0.3,
        isKnit: Math.random() > 0.5,
      },
    };
    return this.normalizeAttributes(raw);
  }

  /**
   * Normalizes extracted attributes for consistent category naming.
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
      normalized.category = categoryMap[normalized.category.toLowerCase()] || 'other';
    }
    return normalized;
  }

  async resizeImage(imageBuffer, maxDimension = 1024) {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return image.resize(maxDimension, maxDimension, { fit: 'inside' }).toBuffer();
    }
    return imageBuffer;
  }

  async processUpload(imageBuffer, fileName) {
    const resized = await this.resizeImage(imageBuffer);
    let processed = resized;
    try {
      processed = await this.removeBackground(resized, fileName.split('.').pop());
    } catch (e) {
      processed = resized;
    }
    const attributes = await this.extractAttributes(processed, fileName);
    return { processedBuffer: processed, attributes, embedding: null };
  }
}

module.exports = new ImageProcessingService();
