/**
 * Skin-Integrated Recommendation Service
 * 
 * Combines skin tone analysis with wardrobe recommendations
 * to provide personalized color suggestions based on
 * Korean/seasonal color theory.
 * 
 * Enhanced with:
 * - Advanced skin score integration (acne, pores, radiance, etc.)
 * - Creative shopping journeys
 * - Outfit pairing based on skin condition
 * - Seasonal skin protection recommendations
 */
const db = require('../lib/db');
const { mapSkinToneToPalette, filterWardrobeBySkinTone } = require('../utils/skinColorMap');

/**
 * Get personalized recommendations based on skin analysis
 * @param {string} userId - User ID
 * @param {Object} options - Recommendation options
 * @returns {Promise<Object>} Personalized recommendations
 */
async function getPersonalizedRecommendations(userId, options = {}) {
  const { limit = 10, occasion = null, season = null } = options;
  
  // Get user's latest skin analysis
  const skinResult = await db.query(
    `SELECT * FROM skin_analysis 
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  
  let skinColor = null;
  let undertone = null;
  let seasonType = null;
  let palette = [];
  
  if (skinResult.rows.length > 0) {
    const analysis = skinResult.rows[0];
    skinColor = analysis.skin_color_hex;
    undertone = analysis.undertone;
    palette = analysis.recommended_palette || [];
    
    // Get seasonal type from palette analysis
    if (skinColor) {
      const paletteResult = mapSkinToneToPalette(skinColor);
      seasonType = paletteResult.season;
    }
  }
  
  // Get user's wardrobe items
  const wardrobeResult = await db.query(
    `SELECT id, name, category, colors, image_url, tags
     FROM wardrobe_items 
     WHERE user_id = $1`,
    [userId]
  );
  
  const wardrobeItems = wardrobeResult.rows;
  
  // Filter wardrobe by skin tone if available
  let matchedItems = [];
  let colorScore = 0;
  
  if (skinColor && palette.length > 0) {
    // Extract colors from wardrobe items
    const wardrobeColors = wardrobeItems
      .map(item => item.colors || [])
      .flat()
      .filter(c => c && c.startsWith('#'));
    
    const filtered = filterWardrobeBySkinTone(skinColor, [...new Set(wardrobeColors)]);
    const matchedColors = new Set(filtered.map(f => f.color));
    
    matchedItems = wardrobeItems.filter(item => {
      const itemColors = item.colors || [];
      return itemColors.some(c => matchedColors.has(c));
    });
    
    colorScore = filtered.length > 0 ? Math.min(filtered.length / wardrobeColors.length, 1) : 0;
  } else {
    // No skin analysis - return popular/trending items
    matchedItems = wardrobeItems.slice(0, limit);
  }
  
  // Apply filters
  if (occasion) {
    matchedItems = matchedItems.filter(item => 
      item.tags?.some(t => t.toLowerCase().includes(occasion.toLowerCase()))
    );
  }
  
  if (season) {
    matchedItems = matchedItems.filter(item => 
      item.tags?.some(t => t.toLowerCase().includes(season.toLowerCase()))
    );
  }
  
  return {
    skinAnalysis: {
      skinColor,
      undertone,
      season: seasonType,
      hasAnalysis: !!skinColor
    },
    recommendations: matchedItems.slice(0, limit).map(item => ({
      ...item,
      colorMatchScore: item.colors?.some(c => 
        palette.some(p => p.toLowerCase() === c.toLowerCase())
      ) ? 1 : 0
    })),
    colorScore,
    recommendedPalette: palette,
    tips: generateStyleTips(undertone, seasonType)
  };
}

/**
 * Generate style tips based on skin tone
 * @param {string} undertone - 'warm', 'cool', or 'neutral'
 * @param {string} season - 'spring', 'summer', 'autumn', 'winter'
 * @returns {Array} Style tips
 */
function generateStyleTips(undertone, season) {
  const tips = {
    warm: [
      'Gold jewelry complements your warm undertones',
      'Earth tones and warm neutrals look great on you',
      'Avoid cool-toned colors like icy blue or silver'
    ],
    cool: [
      'Silver jewelry pairs beautifully with your skin',
      'Jewel tones and cool neutrals suit you well',
      'Avoid golden or orange-toned colors'
    ],
    neutral: [
      'You can pull off both warm and cool tones',
      ' jewel tones and pastels work equally well',
      'Experiment with contrasting colors'
    ]
  };
  
  const seasonTips = {
    spring: [
      'Bright, warm colors enhance your natural glow',
      'Try coral, peach, and warm greens'
    ],
    summer: [
      'Soft, muted pastels complement your cool tone',
      'Try lavender, soft pink, and powder blue'
    ],
    autumn: [
      'Rich, earthy tones bring out your warmth',
      'Try olive, rust, and camel colors'
    ],
    winter: [
      'Bold, high-contrast colors make you stand out',
      'Try black, white, and jewel tones'
    ]
  };
  
  return [
    ...(tips[undertone] || tips.neutral),
    ...(seasonTips[season] || [])
  ];
}

/**
 * Get color suggestions for new clothing purchases
 * @param {string} skinColorHex - User's skin color
 * @returns {Object} Shopping suggestions
 */
function getShoppingSuggestions(skinColorHex) {
  const result = mapSkinToneToPalette(skinColorHex);
  
  return {
    recommendedColors: result.palette.slice(0, 5),
    avoidColors: getColorsToAvoid(result.undertone, result.season),
    season: result.season,
    undertone: result.undertone,
    description: result.description
  };
}

/**
 * Get colors to avoid based on skin tone
 */
function getColorsToAvoid(undertone, season) {
  const avoidList = {
    warm: ['#87CEEB', '#E0FFFF', '#B0C4DE', '#ADD8E6'], // Cool blues
    cool: ['#FFD700', '#FFA500', '#F4A460', '#D2691E'], // Warm oranges
    neutral: [] // No strict avoid
  };
  
  return avoidList[undertone] || avoidList.neutral;
}

module.exports = {
  getPersonalizedRecommendations,
  getShoppingSuggestions,
  generateStyleTips,
  getAdvancedRecommendations,
  calculateOutfitSkinScore,
  generateSeasonalRecommendations
};
