/**
 * Skin Tone to Clothing Palette Mapping
 * 
 * Based on Korean/Seasonal Color Theory:
 * - Spring (Warm, Clear): Bright, warm colors
 * - Summer (Cool, Muted): Soft, pastel colors  
 * - Autumn (Warm, Muted): Earthy, deep colors
 * - Winter (Cool, Clear): Bold, contrast colors
 * 
 * Undertone categories:
 * - Warm: Yellow, golden, peachy undertones
 * - Cool: Pink, rose, blue undertones
 * - Neutral: Mix of warm and cool
 */

/**
 * Convert hex to RGB
 * @param {string} hex - Hex color code
 * @returns {Object} { r, g, b } or null
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color code
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Determine undertone from skin color
 * @param {string} skinColorHex - Skin color hex code
 * @returns {string} 'warm', 'cool', or 'neutral'
 */
function determineUndertone(skinColorHex) {
  const rgb = hexToRgb(skinColorHex);
  if (!rgb) return 'neutral';
  
  const { r, g, b } = rgb;
  
  // Calculate warmth based on color science
  // Warm: more yellow/golden, Cool: more pink/blue
  // Using the formula: warmth = (R - B)
  const warmth = r - b;
  const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  
  // Adjust thresholds based on typical skin tones
  if (warmth > 15) return 'warm';
  if (warmth < -15) return 'cool';
  
  // For neutral range, check saturation
  if (saturation > 0.2) {
    // More saturated = more likely warm
    return warmth > 0 ? 'warm' : 'cool';
  }
  
  return 'neutral';
}

/**
 * Get seasonal color type (Spring, Summer, Autumn, Winter)
 * @param {string} undertone - 'warm' or 'cool'
 * @param {string} skinColorHex - Skin color hex
 * @returns {string} Season name
 */
function getSeasonalType(undertone, skinColorHex) {
  const rgb = hexToRgb(skinColorHex);
  if (!rgb) return 'spring';
  
  const { r, g, b } = rgb;
  const lightness = (r + g + b) / 3 / 255;
  
  if (undertone === 'warm') {
    // Warm + Light = Spring, Warm + Dark = Autumn
    return lightness > 0.5 ? 'spring' : 'autumn';
  } else if (undertone === 'cool') {
    // Cool + Light = Summer, Cool + Dark = Winter
    return lightness > 0.5 ? 'summer' : 'winter';
  }
  
  // Neutral defaults to Spring (most versatile)
  return lightness > 0.5 ? 'spring' : 'autumn';
}

/**
 * Get recommended clothing palette based on skin tone
 * @param {string} skinColorHex - Skin color hex code
 * @returns {Object} { palette, undertone, season, description }
 */
function mapSkinToneToPalette(skinColorHex) {
  const undertone = determineUndertone(skinColorHex);
  const season = getSeasonalType(undertone, skinColorHex);
  
  const palettes = {
    spring: {
      colors: [
        '#FF6B6B', // Coral
        '#FFA07A', // Light Salmon
        '#FFD93D', // Yellow
        '#6BCB77', // Green
        '#4D96FF', // Sky Blue
        '#FF8C42', // Tangerine
        '#98D8AA', // Mint
        '#F7DC6F'  // Cream Yellow
      ],
      description: 'Warm and bright - you shine in vibrant, warm colors!',
      recommended: 'Coral, tangerine, warm yellow, fresh greens'
    },
    summer: {
      colors: [
        '#A0C4FF', // Light Blue
        '#BDB2FF', // Lavender
        '#FFC6FF', // Pink
        '#FDFFB6', // Pale Yellow
        '#CAFFBF', // Light Green
        '#9BF6FF', // Cyan
        '#FFADAD', // Pastel Red
        '#DEB887'  // Burlywood (warm beige)
      ],
      description: 'Cool and muted - soft pastels complement you beautifully!',
      recommended: 'Lavender, soft pink, powder blue, sage green'
    },
    autumn: {
      colors: [
        '#8B4513', // Saddle Brown
        '#D2691E', // Chocolate
        '#556B2F', // Olive Green
        '#B8860B', // Dark Goldenrod
        '#CD853F', // Peru
        '#8FBC8F', // Dark Sea Green
        '#A0522D', // Sienna
        '#DAA520'  // Goldenrod
      ],
      description: 'Warm and muted - earthy tones bring out your glow!',
      recommended: 'Olive, rust, camel, mustard, forest green'
    },
    winter: {
      colors: [
        '#000000', // Black
        '#FFFFFF', // White
        '#DC143C', // Crimson
        '#000080', // Navy
        '#4169E1', // Royal Blue
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#800080'  // Purple
      ],
      description: 'Cool and clear - bold, high-contrast colors suit you!',
      recommended: 'Black, white, navy, royal blue, crimson'
    }
  };
  
  const selectedPalette = palettes[season];
  
  return {
    palette: selectedPalette.colors,
    undertone,
    season,
    description: selectedPalette.description,
    recommended: selectedPalette.recommended
  };
}

/**
 * Get complementary colors for wardrobe items
 * @param {string} skinColorHex - User's skin color
 * @param {Array} wardrobeColors - Array of hex colors from wardrobe
 * @returns {Array} Filtered and sorted wardrobe colors
 */
function filterWardrobeBySkinTone(skinColorHex, wardrobeColors) {
  const { undertone, season } = mapSkinToneToPalette(skinColorHex);
  
  const colorCategories = {
    warm: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#FF8C42', '#D2691E', '#B8860B', '#CD853F', '#556B2F', '#8B4513'],
    cool: ['#A0C4FF', '#BDB2FF', '#FFC6FF', '#000080', '#4169E1', '#DC143C', '#FF00FF', '#00FFFF', '#800080', '#4B0082'],
    neutral: ['#FFFFFF', '#000000', '#808080', '#F5F5DC', '#D3D3D3', '#C0C0C0']
  };
  
  const recommendedColors = colorCategories[undertone] || colorCategories.neutral;
  
  return wardrobeColors
    .map(color => {
      const rgb = hexToRgb(color);
      if (!rgb) return { color, score: 0 };
      
      // Simple matching - check if color is in recommended list
      const isRecommended = recommendedColors.some(rc => 
        rc.toLowerCase() === color.toLowerCase()
      );
      
      return {
        color,
        score: isRecommended ? 1 : 0,
        undertone: undertone
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get hex color from skin tone name (for mock data)
 * @param {string} toneName - Common skin tone name
 * @returns {string} Hex code
 */
function getHexFromToneName(toneName) {
  const toneMap = {
    'fair': '#FFECD2',
    'light': '#F5D0C5',
    'medium': '#D4A574',
    'olive': '#C8AE7D',
    'tan': '#A67B5B',
    'brown': '#8B5A2B',
    'dark': '#5C3D2E',
    'deep': '#3D2314'
  };
  
  return toneMap[toneName?.toLowerCase()] || '#D4A574';
}

module.exports = {
  hexToRgb,
  rgbToHex,
  determineUndertone,
  getSeasonalType,
  mapSkinToneToPalette,
  filterWardrobeBySkinTone,
  getHexFromToneName
};
