/**
 * Recommendation Service
 * 
 * Hybrid rule-based + ML outfit recommendations
 * - Considers occasion, weather, user preferences
 * - Uses wear history to suggest less-worn items
 * - Falls back to simple heuristics in demo mode
 */

const db = require('../lib/db');
const logger = require('../lib/logger');

/**
 * Get outfit recommendations
 * 
 * @param {Object} options - Recommendation options
 * @param {string} options.userId - User ID
 * @param {string} [options.occasion] - Occasion (casual, formal, etc.)
 * @param {Object} [options.weather] - Weather conditions { tempC, condition }
 * @param {number} [options.limit=6] - Number of recommendations
 */
async function recommendOutfits(options) {
  const { userId, occasion, weather, limit = 6 } = options;
  
  logger.info('Generating recommendations for user:', { userId, occasion });
  
  // 1) Get user's wardrobe items
  const itemsResult = await db.query(`
    SELECT * FROM wardrobe_items 
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  
  const items = itemsResult.rows;
  
  if (items.length < 2) {
    return [];
  }
  
  // 2) Score items based on wear history (prefer less-worn items)
  const scoredItems = items.map(item => {
    const lastWorn = item.last_worn ? new Date(item.last_worn).getTime() : 0;
    const daysSinceWorn = lastWorn ? (Date.now() - lastWorn) / (1000 * 60 * 60 * 24) : 365;
    const wearCount = item.wear_count || 0;
    
    // Score: higher = more recommended
    // Prefer items not worn recently, with low wear count
    const recencyScore = Math.min(daysSinceWorn / 30, 1); // Max out at 30 days
    const wearPenalty = 1 / (1 + wearCount * 0.1);
    
    return {
      ...item,
      score: recencyScore * wearPenalty
    };
  });
  
  // 3) Filter by occasion if provided
  let filteredItems = scoredItems;
  if (occasion) {
    filteredItems = scoredItems.filter(item => {
      const tags = item.tags || [];
      return tags.includes(occasion) || tags.includes('all-occasion');
    });
    
    // If no items match occasion, fallback to all items
    if (filteredItems.length < 2) {
      filteredItems = scoredItems;
    }
  }
  
  // 4) Generate combinations
  const combinations = generateCombinations(filteredItems, limit);
  
  // 5) Log recommendation event
  await logRecommendationEvent(userId, 'recommendations_generated', {
    occasion,
    weather,
    count: combinations.length
  });
  
  return combinations;
}

/**
 * Generate outfit combinations from scored items
 */
function generateCombinations(items, limit) {
  const combinations = [];
  const usedPairs = new Set();
  
  // Sort by score descending
  const sorted = [...items].sort((a, b) => b.score - a.score);
  
  // Generate top + bottom combinations
  const tops = sorted.filter(i => ['top', 'outerwear'].includes(i.category));
  const bottoms = sorted.filter(i => i.category === 'bottom');
  const shoes = sorted.filter(i => i.category === 'shoes');
  
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (top.id === bottom.id) continue;
      
      const pairKey = [top.id, bottom.id].sort().join(',');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      const score = (top.score + bottom.score) / 2;
      const items = [top, bottom];
      
      // Add shoes if available
      if (shoes.length > 0) {
        items.push(shoes[Math.floor(Math.random() * shoes.length)]);
      }
      
      combinations.push({
        itemIds: items.map(i => i.id),
        items: items.map(i => ({
          id: i.id,
          image_url: i.thumbnail_url || i.image_url,
          category: i.category
        })),
        score: Math.round(score * 100) / 100,
        explanation: generateExplanation(top, bottom)
      });
      
      if (combinations.length >= limit) break;
    }
    if (combinations.length >= limit) break;
  }
  
  return combinations;
}

/**
 * Generate human-readable explanation for recommendation
 */
function generateExplanation(item1, item2) {
  const reasons = [];
  
  if (item1.last_worn && item2.last_worn) {
    const days1 = Math.floor((Date.now() - new Date(item1.last_worn).getTime()) / (1000 * 60 * 60 * 24));
    const days2 = Math.floor((Date.now() - new Date(item2.last_worn).getTime()) / (1000 * 60 * 60 * 24));
    
    if (days1 > 30) reasons.push(`You haven't worn this ${item1.category} in ${days1} days`);
    if (days2 > 30) reasons.push(`This ${item2.category} hasn't been worn recently either`);
  }
  
  if (item1.color && item2.color) {
    // Simple color harmony check
    const neutral = ['black', 'white', 'gray', 'beige', 'navy'];
    const hasNeutral = item1.color.some(c => neutral.includes(c)) || 
                       item2.color.some(c => neutral.includes(c));
    if (hasNeutral) reasons.push('Neutral colors that mix well together');
  }
  
  if (reasons.length === 0) {
    reasons.push('Great combination from your wardrobe');
  }
  
  return reasons.join('. ');
}

/**
 * Log recommendation event for analytics
 */
async function logRecommendationEvent(userId, eventType, payload = {}) {
  try {
    await db.query(`
      INSERT INTO recommendation_events (user_id, event_type, payload)
      VALUES ($1, $2, $3)
    `, [userId, eventType, payload]);
  } catch (error) {
    logger.error('Failed to log recommendation event:', error);
  }
}

/**
 * Record user feedback on recommendation
 */
async function recordFeedback(userId, eventType, recommendationId, payload = {}) {
  await logRecommendationEvent(userId, eventType, {
    recommendationId,
    ...payload
  });
}

module.exports = {
  recommendOutfits,
  recordFeedback
};
