const youcomService = require('./youcom.service');

const BASE_HASHTAGS = {
  fashion: ['#fashion', '#style', '#ootd', '#lookoftheday'],
  sustainable: ['#sustainablefashion', '#ecofriendly', '#slowfashion'],
  season: ['#springstyle', '#summerlooks', '#fallfashion', '#winteroutfit'],
};

function attributesToHashtags(attrs) {
  const tags = [];
  if (attrs.category) tags.push(`#${String(attrs.category).toLowerCase().replace(/\s+/g, '')}`);
  if (attrs.color) tags.push(`#${String(attrs.color).toLowerCase().replace(/\s+/g, '')}`);
  if (attrs.style) tags.push(`#${String(attrs.style).toLowerCase().replace(/\s+/g, '')}style`);
  if (attrs.pattern) tags.push(`#${String(attrs.pattern).toLowerCase().replace(/\s+/g, '')}`);
  return tags;
}

function trendsToHashtags(trends) {
  const keywords = [];
  const items = trends?.trends || trends?.fallback || [];
  items.forEach((t) => {
    const words = (t.name || t.title || '').toLowerCase().split(/\s+/);
    words.forEach((word) => {
      if (word.length > 3 && !keywords.includes(`#${word}`)) {
        keywords.push(`#${word}`);
      }
    });
  });
  return keywords.slice(0, 15);
}

class HashtagService {
  /**
   * Generate hashtag suggestions based on outfit attributes and real-time fashion trends.
   * @param {Object} outfitAttributes - { category, color, style, pattern }
   * @param {number} limit - Max number of hashtags
   * @returns {Promise<string[]>} Hashtag array
   */
  async suggestHashtags(outfitAttributes = {}, limit = 10) {
    const trendsData = await youcomService.searchFashionTrends();
    const trends = youcomService.extractTrends(trendsData);

    const fromAttributes = attributesToHashtags(outfitAttributes);
    const trendingHashtags = trendsToHashtags(trends);
    const trendColorTags = (trends.trendingColors || []).map((c) => `#${String(c).toLowerCase().replace(/\s+/g, '')}`).slice(0, 5);
    const keywordTags = (trends.keywords || []).map((k) => `#${String(k).replace(/\s+/g, '')}`).slice(0, 5);

    const combined = [
      ...fromAttributes,
      ...trendingHashtags,
      ...trendColorTags,
      ...keywordTags,
      ...BASE_HASHTAGS.fashion,
    ];
    const unique = [...new Set(combined)];

    const ranked = unique.sort((a, b) => {
      const aTrending = trendingHashtags.includes(a) || trendColorTags.includes(a) ? 1 : 0;
      const bTrending = trendingHashtags.includes(b) || trendColorTags.includes(b) ? 1 : 0;
      return bTrending - aTrending;
    });

    return ranked.slice(0, limit);
  }
}

module.exports = new HashtagService();
