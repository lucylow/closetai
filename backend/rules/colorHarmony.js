/**
 * Color theory rules for outfit coordination.
 * Ensures items in an outfit have harmonious color combinations.
 */
class ColorHarmony {
  static COMPLEMENTARY = {
    red: ['green', 'teal'],
    green: ['red', 'coral'],
    blue: ['orange', 'terracotta'],
    orange: ['blue', 'navy'],
    yellow: ['purple', 'violet'],
    purple: ['yellow', 'gold'],
    pink: ['green', 'mint'],
    teal: ['coral', 'red'],
    navy: ['orange', 'cream'],
    black: ['white', 'cream', 'gray', 'any'],
    white: ['black', 'navy', 'any'],
    gray: ['pink', 'black', 'white'],
    beige: ['brown', 'navy', 'olive'],
    brown: ['beige', 'cream', 'olive'],
    cream: ['brown', 'navy', 'black'],
    olive: ['burgundy', 'cream', 'beige'],
    burgundy: ['olive', 'gold', 'cream'],
  };

  static NEUTRALS = ['black', 'white', 'gray', 'beige', 'navy', 'cream', 'brown'];

  /**
   * Get complementary colors for a given color.
   * @param {string} color - Color name (e.g., 'red', 'navy')
   * @returns {string[]} Complementary colors
   */
  static complementary(color) {
    if (!color) return [];
    const key = color.toLowerCase().trim();
    return this.COMPLEMENTARY[key] || [];
  }

  /**
   * Check if two colors are harmonious (complementary, neutral, or same).
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @returns {boolean}
   */
  static areHarmonious(color1, color2) {
    if (!color1 || !color2) return true;
    const c1 = color1.toLowerCase().trim();
    const c2 = color2.toLowerCase().trim();
    if (c1 === c2) return true; // monochromatic
    if (this.NEUTRALS.includes(c1) || this.NEUTRALS.includes(c2)) return true;
    const comp = this.complementary(c1);
    if (comp.includes(c2) || comp.includes('any')) return true;
    if (this.complementary(c2).includes(c1)) return true;
    return false;
  }

  /**
   * Score color harmony for a set of items (0-1).
   * @param {Array<{color?: string}>} items - Items with color in extractedAttributes or color field
   * @returns {number} Harmony score
   */
  static scoreOutfit(items) {
    if (!items?.length) return 1;
    const colors = items.map((i) => (i.extractedAttributes?.color || i.color || '').toLowerCase().trim()).filter(Boolean);
    if (colors.length < 2) return 1;

    let harmoniousPairs = 0;
    let totalPairs = 0;
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        totalPairs++;
        if (this.areHarmonious(colors[i], colors[j])) harmoniousPairs++;
      }
    }
    return totalPairs > 0 ? harmoniousPairs / totalPairs : 1;
  }

  /**
   * Check if all colors in an outfit are harmonious.
   */
  static checkHarmony(items) {
    return this.scoreOutfit(items) >= 0.8;
  }
}

module.exports = ColorHarmony;
