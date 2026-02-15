/**
 * User preference profile for personalized recommendations.
 * Learns from explicit feedback (like/dislike/rating) and implicit signals (wear count).
 * Uses simple Bayesian-style weight updates for ML from user feedback.
 */
class UserProfile {
  constructor(userId) {
    this.userId = userId;
    this.preferences = {
      colors: {},      // color -> weight
      categories: {}, // category -> weight
      styles: {},     // style -> weight
      items: {},      // itemId -> weight
    };
  }

  /**
   * Update profile based on interaction.
   * @param {Object} item - Wardrobe item with id, extractedAttributes
   * @param {string} interactionType - 'like' | 'dislike' | 'wear' | number (1-5 rating)
   */
  update(item, interactionType) {
    let weight = 0.5;
    if (interactionType === 'like' || interactionType === 'wear') weight = 1;
    else if (interactionType === 'dislike') weight = -1;
    else if (typeof interactionType === 'number') {
      if (interactionType >= 4) weight = 1;
      else if (interactionType <= 2) weight = -1;
      else weight = 0.3;
    }

    const attrs = item.extractedAttributes || {};

    if (attrs.color) {
      const c = attrs.color.toLowerCase();
      this.preferences.colors[c] = (this.preferences.colors[c] || 0) + weight;
    }
    if (attrs.category) {
      const cat = attrs.category.toLowerCase();
      this.preferences.categories[cat] = (this.preferences.categories[cat] || 0) + weight;
    }
    if (attrs.style) {
      const s = attrs.style.toLowerCase();
      this.preferences.styles[s] = (this.preferences.styles[s] || 0) + weight;
    }
    if (item.id) {
      this.preferences.items[item.id] = (this.preferences.items[item.id] || 0) + weight;
    }
  }

  /**
   * Get personalized score for an item (higher = more preferred).
   * @param {Object} item - Wardrobe item
   * @returns {number} Score (can be negative)
   */
  scoreItem(item) {
    const attrs = item.extractedAttributes || {};
    let score = 0;
    if (attrs.color) score += this.preferences.colors[attrs.color.toLowerCase()] || 0;
    if (attrs.category) score += this.preferences.categories[attrs.category.toLowerCase()] || 0;
    if (attrs.style) score += this.preferences.styles[attrs.style.toLowerCase()] || 0;
    if (item.id) score += this.preferences.items[item.id] || 0;
    return score;
  }

  /**
   * Get normalized preference score for an item (0-1).
   * Uses min-max normalization across typical range.
   */
  scoreItemNormalized(item) {
    const raw = this.scoreItem(item);
    // Typical range: -3 to +3. Map to 0-1 with 0.5 as neutral.
    const normalized = 1 / (1 + Math.exp(-raw * 0.5));
    return normalized;
  }
}

const userProfiles = new Map();

function getUserProfile(userId) {
  const key = String(userId);
  if (!userProfiles.has(key)) {
    userProfiles.set(key, new UserProfile(userId));
  }
  return userProfiles.get(key);
}

module.exports = {
  UserProfile,
  getUserProfile,
  userProfiles,
};
