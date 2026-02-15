/**
 * Weather-to-clothing appropriateness rules.
 * Maps weather tags (hot, cold, rainy, etc.) to preferred/avoided item types.
 */
const weatherRules = {
  hot: {
    preferredCategories: ['top', 'bottom', 'dress', 'shoes', 'accessory'],
    preferredKeywords: ['t-shirt', 'tank', 'shorts', 'dress', 'sandals', 'linen', 'cotton', 'light'],
    avoidKeywords: ['coat', 'sweater', 'jacket', 'boots', 'wool', 'heavy', 'fleece'],
    avoidCategories: [],
  },
  cold: {
    preferredCategories: ['outerwear', 'top', 'bottom', 'shoes', 'accessory'],
    preferredKeywords: ['coat', 'jacket', 'sweater', 'boots', 'scarf', 'wool', 'fleece'],
    avoidKeywords: ['shorts', 'tank', 'sandals', 'sleeveless'],
    avoidCategories: [],
  },
  mild: {
    preferredCategories: [],
    preferredKeywords: [],
    avoidKeywords: [],
    avoidCategories: [],
  },
  rainy: {
    preferredCategories: ['outerwear', 'shoes', 'accessory'],
    preferredKeywords: ['raincoat', 'waterproof', 'umbrella'],
    avoidKeywords: ['suede', 'delicate', 'leather', 'silk'],
    avoidCategories: [],
  },
  snowy: {
    preferredCategories: ['outerwear', 'shoes', 'accessory'],
    preferredKeywords: ['coat', 'boots', 'warm', 'insulated'],
    avoidKeywords: ['sandals', 'open-toe', 'light'],
    avoidCategories: [],
  },
};

/**
 * Get rules for weather tags (uses first tag, or 'mild' as default).
 */
function getRules(weatherTags) {
  const tags = Array.isArray(weatherTags) ? weatherTags : [weatherTags];
  const tag = tags.find((t) => weatherRules[t]);
  return weatherRules[tag || 'mild'] || weatherRules.mild;
}

/**
 * Check if an item is appropriate for the weather.
 * @param {Object} item - Wardrobe item
 * @param {string[]} weatherTags
 * @returns {{ ok: boolean, score: number }}
 */
function checkItem(item, weatherTags) {
  const rules = getRules(weatherTags);
  if (!rules.preferredKeywords?.length && !rules.avoidKeywords?.length) {
    return { ok: true, score: 1 };
  }

  const attrs = item.extractedAttributes || {};
  const name = (attrs.name || '').toLowerCase();
  const category = (attrs.category || '').toLowerCase();
  const tags = (item.userTags || []).map((t) => t.toLowerCase());
  const text = [name, category, ...tags].join(' ');

  const hasAvoided = rules.avoidKeywords.some((kw) => text.includes(kw));
  if (hasAvoided) return { ok: false, score: 0 };

  let score = 0.5;
  const hasPreferred = rules.preferredKeywords.some((kw) => text.includes(kw));
  if (hasPreferred) score += 0.5;
  return { ok: true, score: Math.min(1, score) };
}

/**
 * Score an outfit for weather appropriateness (0-1).
 */
function scoreOutfit(items, weatherTags) {
  if (!items?.length) return 1;
  const results = items.map((i) => checkItem(i, weatherTags));
  const allOk = results.every((r) => r.ok);
  if (!allOk) return 0;
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  return avg;
}

module.exports = {
  weatherRules,
  getRules,
  checkItem,
  scoreOutfit,
};
