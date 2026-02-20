/**
 * Occasion appropriateness rules.
 * Maps occasions to allowed/avoided categories, styles, and colors.
 */
const occasionRules = {
  casual: {
    categories: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'],
    styles: ['casual', 'sporty', 'bohemian', 'relaxed', 'streetwear'],
    avoidStyles: ['formal', 'evening', 'black-tie'],
    avoidCategories: [],
    preferredColors: [],
  },
  formal: {
    categories: ['dress', 'top', 'bottom', 'outerwear', 'shoes'],
    styles: ['formal', 'elegant', 'classic', 'professional'],
    avoidStyles: ['casual', 'sporty', 'beachwear'],
    avoidCategories: [],
    preferredColors: ['black', 'navy', 'white', 'gray', 'burgundy'],
  },
  party: {
    categories: ['dress', 'top', 'bottom', 'accessory', 'shoes', 'outerwear'],
    styles: ['party', 'glam', 'evening', 'edgy', 'elegant'],
    avoidStyles: ['casual', 'sporty'],
    avoidCategories: [],
    preferredColors: ['black', 'red', 'gold', 'silver', 'navy', 'burgundy'],
  },
  work: {
    categories: ['top', 'bottom', 'dress', 'outerwear', 'shoes'],
    styles: ['formal', 'smart casual', 'professional', 'classic'],
    avoidStyles: ['ripped', 'beachwear', 'party'],
    avoidCategories: [],
    preferredColors: ['navy', 'black', 'white', 'gray', 'beige'],
  },
  date: {
    categories: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'],
    styles: ['elegant', 'casual', 'romantic', 'smart casual'],
    avoidStyles: ['sporty', 'too casual'],
    avoidCategories: [],
    preferredColors: [],
  },
  outdoor: {
    categories: ['top', 'bottom', 'outerwear', 'shoes', 'accessory'],
    styles: ['sporty', 'casual', 'outdoor', 'practical'],
    avoidStyles: ['formal', 'delicate'],
    avoidCategories: [],
    preferredColors: [],
  },
};

/**
 * Get rules for an occasion (normalized to lowercase).
 */
function getRules(occasion) {
  const key = (occasion || 'casual').toLowerCase();
  return occasionRules[key] || occasionRules.casual;
}

/**
 * Check if an item is appropriate for an occasion.
 * @param {Object} item - Wardrobe item with extractedAttributes
 * @param {string} occasion
 * @returns {{ ok: boolean, score: number }}
 */
function checkItem(item, occasion) {
  const rules = getRules(occasion);
  const attrs = item.extractedAttributes || {};
  const category = (attrs.category || '').toLowerCase();
  const style = (attrs.style || '').toLowerCase();

  if (category && rules.categories.length > 0 && !rules.categories.includes(category)) {
    return { ok: false, score: 0 };
  }
  if (rules.avoidStyles.some((s) => style.includes(s))) {
    return { ok: false, score: 0 };
  }
  if (rules.avoidCategories.includes(category)) {
    return { ok: false, score: 0 };
  }

  let score = 0.5;
  if (rules.styles.some((s) => style.includes(s))) score += 0.3;
  const color = (attrs.color || '').toLowerCase();
  if (rules.preferredColors.length && rules.preferredColors.includes(color)) score += 0.2;
  return { ok: true, score: Math.min(1, score) };
}

/**
 * Score an outfit for occasion appropriateness (0-1).
 * @param {Array} items - Wardrobe items
 * @param {string} occasion
 */
function scoreOutfit(items, occasion) {
  if (!items?.length) return 0;
  const results = items.map((i) => checkItem(i, occasion));
  const allOk = results.every((r) => r.ok);
  if (!allOk) return 0;
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  return avg;
}

module.exports = {
  occasionRules,
  getRules,
  checkItem,
  scoreOutfit,
};
