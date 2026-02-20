/**
 * Personalized Recommendation Engine – Trend-Aware
 * Scores outfits based on how well they match current trends (with citation data)
 * and the user's actual wardrobe.
 */
const { WardrobeItem } = require('../models');
const youcomService = require('./youcom.service');

class PersonalizedRecommendationService {
  /**
   * For each item in user's wardrobe, compute a trendiness score based on live trend data.
   * Returns items enriched with trendScore and matching citations.
   */
  async scoreItemsAgainstTrends(userId) {
    const wardrobe = await WardrobeItem.findAll({ where: { userId } });
    const trendData = await youcomService.getFashionTrendsWithCitations('fashion', 20);

    const trendKeywords = (trendData.trends || []).map((t) => t.keyword?.toLowerCase()).filter(Boolean);
    const trends = trendData.trends || [];
    const citations = trendData.citations || [];

    const scoredItems = wardrobe.map((item) => {
      const attrs = item.extractedAttributes || {};
      const itemText = `${attrs.color || ''} ${attrs.category || ''} ${attrs.pattern || ''} ${attrs.style || ''} ${(item.userTags || []).join(' ')}`.toLowerCase();

      let matchCount = 0;
      const matchingTrends = [];
      const seenCitationIds = new Set();

      trendKeywords.forEach((kw) => {
        if (itemText.includes(kw)) {
          matchCount++;
          const trend = trends.find((t) => t.keyword?.toLowerCase() === kw);
          if (trend?.citationId) {
            const citation = citations.find((c) => c.id === trend.citationId);
            if (citation && !seenCitationIds.has(citation.id)) {
              seenCitationIds.add(citation.id);
              matchingTrends.push({ keyword: kw, citation });
            }
          }
        }
      });

      const trendScore = trendKeywords.length > 0 ? Math.min(matchCount / 3, 1.0) : 0.3;

      return {
        ...item.toJSON(),
        trendScore,
        matchingTrends,
      };
    });

    return scoredItems;
  }

  /**
   * Generate outfit recommendations that are both personalized (based on user wardrobe)
   * and trend-aware, including citations for each trend used.
   */
  async getPersonalizedOutfits(userId, limit = 5) {
    const scoredItems = await this.scoreItemsAgainstTrends(userId);

    const getAttr = (item, key) => item.extractedAttributes?.[key];
    const tops = scoredItems.filter((i) => getAttr(i, 'category') === 'top');
    const bottoms = scoredItems.filter((i) => getAttr(i, 'category') === 'bottom');
    const dresses = scoredItems.filter((i) => getAttr(i, 'category') === 'dress');
    const outerwear = scoredItems.filter((i) => getAttr(i, 'category') === 'outerwear');
    const shoes = scoredItems.filter((i) => getAttr(i, 'category') === 'shoes');

    const outfits = [];

    tops.forEach((top) => {
      bottoms.forEach((bottom) => {
        const comboScore = (top.trendScore + bottom.trendScore) / 2;
        const allMatchingTrends = this._dedupeTrends([...(top.matchingTrends || []), ...(bottom.matchingTrends || [])]);
        outfits.push({
          items: [top, bottom],
          trendScore: comboScore,
          matchingTrends: allMatchingTrends,
        });
      });
    });

    dresses.forEach((dress) => {
      outfits.push({
        items: [dress],
        trendScore: dress.trendScore,
        matchingTrends: dress.matchingTrends || [],
      });
    });

    outfits.sort((a, b) => b.trendScore - a.trendScore);
    return outfits.slice(0, limit);
  }

  _dedupeTrends(trends) {
    const seen = new Set();
    return trends.filter((t) => {
      const key = `${t.keyword}-${t.citation?.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = new PersonalizedRecommendationService();
