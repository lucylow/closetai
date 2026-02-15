/**
 * Constraint Satisfaction Solver for Outfit Compatibility
 * Checks color harmony, occasion appropriateness, weather suitability, and style matching.
 */

function normalizeText(s = '') {
  return s.toString().trim().toLowerCase();
}

class ConstraintSolver {
  /**
   * Check if two colors are harmonious (simplified).
   */
  colorHarmony(color1, color2) {
    if (!color1 || !color2) return true;
    const c1 = normalizeText(color1);
    const c2 = normalizeText(color2);
    const neutrals = ['black', 'white', 'gray', 'grey', 'beige', 'navy', 'cream', 'ivory'];
    if (neutrals.includes(c1) || neutrals.includes(c2)) return true;
    // Complementary pairs
    const complementary = {
      red: 'green',
      green: 'red',
      blue: 'orange',
      orange: 'blue',
      yellow: 'purple',
      purple: 'yellow',
    };
    return complementary[c1] === c2 || complementary[c2] === c1;
  }

  /**
   * Check if an outfit satisfies all constraints.
   * @param {Array} outfitItems - Array of item objects (with extractedAttributes)
   * @param {Object} constraints - { occasion, weatherTags, userStylePrefs }
   */
  isCompatible(outfitItems, constraints = {}) {
    if (!outfitItems?.length) return false;

    const getAttr = (i, k) => i.extractedAttributes?.[k] || i[k];

    // 1. No duplicate main categories (one top, one bottom, or one dress)
    const categories = outfitItems.map((i) => getAttr(i, 'category')).filter(Boolean);
    const mainCats = categories.filter((c) =>
      ['top', 'bottom', 'dress'].includes(normalizeText(c))
    );
    const hasDress = mainCats.some((c) => normalizeText(c) === 'dress');
    const hasTop = mainCats.some((c) => normalizeText(c) === 'top');
    const hasBottom = mainCats.some((c) => normalizeText(c) === 'bottom');
    if (hasDress && (hasTop || hasBottom)) return false;
    if (hasTop && hasBottom && mainCats.filter((c) => normalizeText(c) === 'top').length > 1)
      return false;
    if (hasTop && hasBottom && mainCats.filter((c) => normalizeText(c) === 'bottom').length > 1)
      return false;

    // 2. Color harmony among all items
    const colors = outfitItems.map((i) => getAttr(i, 'color')).filter(Boolean);
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (!this.colorHarmony(colors[i], colors[j])) return false;
      }
    }

    // 3. Occasion appropriateness
    if (constraints.occasion) {
      const styles = outfitItems.map((i) => getAttr(i, 'style')).filter(Boolean);
      const tags = outfitItems.flatMap((i) => i.userTags || i.tags || []).map(normalizeText);
      const itemText = [...styles, ...tags].join(' ');
      const occasionRules = {
        casual: ['casual', 'sporty', 'relaxed', 'everyday', 'street'],
        formal: ['formal', 'elegant', 'business', 'professional'],
        party: ['party', 'edgy', 'festive', 'night'],
        work: ['formal', 'smart casual', 'professional', 'business', 'office'],
        sport: ['sport', 'athletic', 'gym', 'athleisure'],
      };
      const allowed = occasionRules[normalizeText(constraints.occasion)] || occasionRules.casual;
      if (allowed.length && !allowed.some((s) => itemText.includes(s))) return false;
    }

    // 4. Weather suitability
    const weatherTags = constraints.weatherTags || [];
    if (weatherTags.length) {
      const weather = weatherTags.map(normalizeText);
      if (weather.includes('cold')) {
        const hasOuterwear = outfitItems.some(
          (i) => normalizeText(getAttr(i, 'category')) === 'outerwear'
        );
        const hasWarmItem = outfitItems.some((i) => {
          const style = normalizeText(getAttr(i, 'style') || '');
          const cat = normalizeText(getAttr(i, 'category') || '');
          return (
            style.includes('sweater') ||
            style.includes('jacket') ||
            style.includes('coat') ||
            cat === 'outerwear'
          );
        });
        if (!hasOuterwear && !hasWarmItem) return false;
      }
      if (weather.includes('rainy')) {
        const hasSuede = outfitItems.some(
          (i) => normalizeText(getAttr(i, 'material') || '') === 'suede'
        );
        if (hasSuede) return false;
      }
    }

    return true;
  }

  /**
   * Generate valid outfit combinations from wardrobe using constraints.
   * @param {Array} wardrobeItems - Wardrobe items with extractedAttributes
   * @param {Object} constraints - { occasion, weatherTags }
   * @returns {Array<Array>} Array of valid outfit item arrays
   */
  generateValidOutfits(wardrobeItems, constraints = {}) {
    const getAttr = (item, key) => item.extractedAttributes?.[key];
    const tops = wardrobeItems.filter((i) => normalizeText(getAttr(i, 'category')) === 'top');
    const bottoms = wardrobeItems.filter((i) => normalizeText(getAttr(i, 'category')) === 'bottom');
    const dresses = wardrobeItems.filter((i) => normalizeText(getAttr(i, 'category')) === 'dress');
    const outerwear = wardrobeItems.filter(
      (i) => normalizeText(getAttr(i, 'category')) === 'outerwear'
    );
    const shoes = wardrobeItems.filter((i) => normalizeText(getAttr(i, 'category')) === 'shoes');
    const accessories = wardrobeItems.filter(
      (i) => normalizeText(getAttr(i, 'category')) === 'accessory'
    );

    const candidates = [];
    const weatherTags = constraints.weatherTags || [];
    const needsOuterwear = weatherTags.some((t) =>
      ['cold', 'mild'].includes(normalizeText(t))
    );

    const maxPerCategory = 6;
    const topCandidates = tops.slice(0, maxPerCategory);
    const bottomCandidates = bottoms.slice(0, maxPerCategory);
    const dressCandidates = dresses.slice(0, maxPerCategory);

    // Dresses alone (optionally + shoes, + accessory)
    dressCandidates.forEach((d) => {
      const outfit = [d];
      if (this.isCompatible(outfit, constraints)) candidates.push(outfit);
      if (shoes.length) {
        const withShoes = [d, shoes[0]];
        if (this.isCompatible(withShoes, constraints)) candidates.push(withShoes);
      }
    });

    // Top + bottom
    topCandidates.forEach((t) => {
      bottomCandidates.forEach((b) => {
        let outfit = [t, b];
        if (needsOuterwear && outerwear.length) {
          outfit = [t, b, outerwear[0]];
        }
        if (this.isCompatible(outfit, constraints)) candidates.push(outfit);
        if (shoes.length) {
          const withShoes = [...outfit, shoes[0]];
          if (this.isCompatible(withShoes, constraints)) candidates.push(withShoes);
        }
        if (accessories.length && Math.random() > 0.5) {
          const withAcc = [...outfit, accessories[0]];
          if (this.isCompatible(withAcc, constraints)) candidates.push(withAcc);
        }
      });
    });

    // Fallback: any valid combination
    if (candidates.length === 0 && wardrobeItems.length > 0) {
      const fallback = wardrobeItems.slice(0, Math.min(3, wardrobeItems.length));
      if (this.isCompatible(fallback, constraints)) candidates.push(fallback);
    }

    return candidates;
  }
}

module.exports = new ConstraintSolver();
