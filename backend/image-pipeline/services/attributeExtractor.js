/**
 * Extracts visual attributes from clothing images:
 * - Color (dominant via get-image-colors)
 * - Type/category (OpenAI Vision or filename heuristics)
 * - Pattern (OpenAI Vision or heuristics)
 * - Brand (optional OCR, currently null)
 */
const getColors = require('get-image-colors');
const env = require('../../config/env');

const CATEGORY_MAP = {
  top: 'top',
  shirt: 'top',
  blouse: 'top',
  tshirt: 'top',
  tee: 'top',
  't-shirt': 'top',
  sweater: 'top',
  bottom: 'bottom',
  pants: 'bottom',
  jeans: 'bottom',
  trousers: 'bottom',
  skirt: 'bottom',
  shorts: 'bottom',
  dress: 'dress',
  gown: 'dress',
  outerwear: 'outerwear',
  jacket: 'outerwear',
  coat: 'outerwear',
  cardigan: 'outerwear',
  blazer: 'outerwear',
  shoes: 'shoes',
  footwear: 'shoes',
  sneaker: 'shoes',
  boot: 'shoes',
  sandal: 'shoes',
  accessory: 'accessory',
  hat: 'accessory',
  cap: 'accessory',
  scarf: 'accessory',
  bag: 'accessory',
  belt: 'accessory',
};

const COLOR_NAMES = [
  'black', 'white', 'gray', 'grey', 'navy', 'blue', 'red', 'green', 'brown',
  'beige', 'pink', 'purple', 'orange', 'yellow', 'cream', 'burgundy', 'olive',
  'tan', 'khaki', 'maroon', 'teal', 'coral', 'gold', 'silver',
];

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

/**
 * Map hex/rgb to nearest named color.
 */
function nearestColorName(hex) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return 'unknown';
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  const rgb = [r, g, b];

  let nearest = 'unknown';
  let minDist = Infinity;
  const colorMap = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    gray: [128, 128, 128],
    navy: [0, 0, 128],
    blue: [0, 0, 255],
    red: [255, 0, 0],
    green: [0, 128, 0],
    brown: [139, 69, 19],
    beige: [245, 245, 220],
    pink: [255, 192, 203],
    purple: [128, 0, 128],
    orange: [255, 165, 0],
    yellow: [255, 255, 0],
    cream: [255, 253, 208],
    burgundy: [128, 0, 32],
    olive: [128, 128, 0],
    tan: [210, 180, 140],
    khaki: [195, 176, 145],
    maroon: [128, 0, 0],
    teal: [0, 128, 128],
    coral: [255, 127, 80],
    gold: [255, 215, 0],
    silver: [192, 192, 192],
  };
  for (const [name, ref] of Object.entries(colorMap)) {
    const d = colorDistance(rgb, ref);
    if (d < minDist) {
      minDist = d;
      nearest = name;
    }
  }
  return nearest;
}

class AttributeExtractor {
  constructor() {
    this.openai = null;
    if (env.openai?.apiKey) {
      try {
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({ apiKey: env.openai.apiKey });
        this.openai = new OpenAIApi(configuration);
      } catch (e) {
        this.openai = null;
      }
    }
  }

  /**
   * Extract dominant color from image using get-image-colors.
   * @param {Buffer} imageBuffer
   * @returns {Promise<{hex: string, name: string}>}
   */
  _detectMime(buffer) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) return 'image/png';
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/webp';
    return 'image/jpeg';
  }

  async extractDominantColor(imageBuffer) {
    try {
      const mime = this._detectMime(imageBuffer);
      const colors = await getColors(imageBuffer, mime);
      if (!colors || colors.length === 0) {
        return { hex: '#808080', name: 'gray' };
      }
      const dominant = colors[0];
      const hex = (typeof dominant.hex === 'function' ? dominant.hex() : dominant.hex) || '#808080';
      const name = nearestColorName(hex);
      return { hex, name };
    } catch (err) {
      console.warn('Color extraction failed:', err.message);
      return { hex: '#808080', name: 'gray' };
    }
  }

  /**
   * Use OpenAI Vision to extract clothing attributes when API key is available.
   */
  async extractViaVision(imageBuffer) {
    if (!this.openai) return null;
    try {
      const base64 = imageBuffer.toString('base64');
      const mime = this._detectMime(imageBuffer);
      const dataUrl = `data:${mime};base64,${base64}`;

      const response = await this.openai.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this clothing item image. Respond with ONLY a JSON object (no markdown, no extra text) with these exact keys:
{
  "category": "top|bottom|outerwear|dress|shoes|accessory|other",
  "pattern": "solid|striped|plaid|floral|print|knit|polka dot|geometric|abstract|other",
  "style": "casual|formal|sporty|vintage|bohemian|minimalist|other",
  "confidence": 0.0-1.0
}`,
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.2,
      });

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      if (!content) return null;

      const parsed = JSON.parse(content.replace(/```json?\s*|\s*```/g, '').trim());
      return {
        category: CATEGORY_MAP[parsed.category?.toLowerCase()] || parsed.category || 'other',
        pattern: parsed.pattern || 'solid',
        style: parsed.style || 'casual',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      };
    } catch (err) {
      console.warn('Vision attribute extraction failed:', err.message);
      return null;
    }
  }

  /**
   * Fallback: extract category from filename.
   */
  extractFromFilename(fileName) {
    const name = (fileName || '').toLowerCase();
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser') || name.includes('short')) return 'bottom';
    if (name.includes('dress') || name.includes('gown')) return 'dress';
    if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot') || name.includes('sandal')) return 'shoes';
    if (name.includes('jacket') || name.includes('coat') || name.includes('cardigan') || name.includes('blazer')) return 'outerwear';
    if (name.includes('hat') || name.includes('cap') || name.includes('scarf') || name.includes('bag') || name.includes('belt')) return 'accessory';
    return 'top';
  }

  /**
   * Main entry: extract all attributes.
   * @param {Buffer} imageBuffer
   * @param {string} fileName
   * @returns {Promise<Object>}
   */
  async extractAttributes(imageBuffer, fileName = '') {
    const [colorResult, visionResult] = await Promise.all([
      this.extractDominantColor(imageBuffer),
      this.extractViaVision(imageBuffer),
    ]);

    const category = visionResult?.category ?? this.extractFromFilename(fileName);
    const pattern = visionResult?.pattern ?? 'solid';
    const style = visionResult?.style ?? 'casual';
    const confidence = visionResult?.confidence ?? 0.7;

    return {
      color: colorResult.name,
      colorHex: colorResult.hex,
      category,
      pattern,
      style,
      brand: null,
      confidence,
    };
  }
}

module.exports = new AttributeExtractor();
