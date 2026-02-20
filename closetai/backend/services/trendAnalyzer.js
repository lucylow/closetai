class TrendAnalyzer {
  /**
   * Parse search results to extract trending colors, categories, styles, and keywords.
   * @param {Object} searchData - Raw You.com search response
   * @returns {Object} Structured trends
   */
  extractTrends(searchData) {
    const trendingColors = new Set();
    const trendingCategories = new Set();
    const trendingStyles = new Set();
    const keywords = new Set();
    const sources = [];

    if (!searchData.results?.web) {
      return {
        trendingColors: [],
        trendingCategories: [],
        trendingStyles: [],
        keywords: [],
        sources,
      };
    }

    for (const result of searchData.results.web) {
      const title = result.title?.toLowerCase() || '';
      const description = result.description?.toLowerCase() || '';
      const text = title + ' ' + description;

      // Extract colors
      const colorMatches = text.match(
        /\b(red|blue|green|yellow|purple|orange|black|white|gray|pink|brown|beige|navy|teal|sage|lavender|terracotta|coral|mustard|burgundy|emerald|olive|ivory)\b/g
      );
      if (colorMatches) colorMatches.forEach((c) => trendingColors.add(c));

      // Extract categories (simple keyword mapping)
      const categoryKeywords = [
        'top',
        'bottom',
        'dress',
        'outerwear',
        'jacket',
        'coat',
        'shoes',
        'accessory',
        'bag',
        'hat',
      ];
      categoryKeywords.forEach((cat) => {
        if (text.includes(cat)) trendingCategories.add(cat);
      });

      // Extract styles
      const styleKeywords = [
        'casual',
        'formal',
        'sporty',
        'bohemian',
        'minimalist',
        'vintage',
        'streetwear',
        'elegant',
        'edgy',
      ];
      styleKeywords.forEach((style) => {
        if (text.includes(style)) trendingStyles.add(style);
      });

      // Extract keywords (n-grams from titles)
      const words = title.split(/\W+/).filter((w) => w.length > 3);
      words.forEach((w) => keywords.add(w));

      // Save source
      sources.push({
        url: result.url,
        title: result.title,
        snippet: result.description,
      });
    }

    return {
      trendingColors: Array.from(trendingColors).slice(0, 10),
      trendingCategories: Array.from(trendingCategories).slice(0, 10),
      trendingStyles: Array.from(trendingStyles).slice(0, 10),
      keywords: Array.from(keywords).slice(0, 20),
      sources,
    };
  }

  /**
   * Score an item against extracted trends.
   * @param {Object} item - Wardrobe item with extractedAttributes
   * @param {Object} trends - Trends object from extractTrends
   * @returns {number} Trendiness score (0-1)
   */
  scoreItemTrendiness(item, trends) {
    let score = 0;
    const attrs = item.extractedAttributes || {};
    const color = attrs.color?.toLowerCase();
    const category = attrs.category?.toLowerCase();
    const style = attrs.style?.toLowerCase();

    if (color && trends.trendingColors.includes(color)) score += 0.3;
    if (category && trends.trendingCategories.includes(category)) score += 0.2;
    if (style && trends.trendingStyles.includes(style)) score += 0.2;

    // Check if any keywords match item name or tags
    const itemText = `${attrs.name || ''} ${item.userTags?.join(' ') || ''}`.toLowerCase();
    const keywordMatch = trends.keywords.some((kw) => itemText.includes(kw));
    if (keywordMatch) score += 0.3;

    return Math.min(score, 1);
  }
}

module.exports = new TrendAnalyzer();
