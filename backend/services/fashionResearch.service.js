const youcomService = require('./youcom.service');
const trendAnalyzer = require('./trendAnalyzer');
const { WardrobeItem } = require('../models');

class FashionResearchService {
  /**
   * Perform contextual fashion research for a user.
   * @param {string} userId - User ID
   * @param {string} occasion - Optional occasion filter
   * @returns {Promise<Object>} Personalized trend report
   */
  async researchUserFashion(userId, occasion = null) {
    // 1. Fetch user's wardrobe
    const wardrobe = await WardrobeItem.findAll({
      where: { userId },
      attributes: ['id', 'extractedAttributes', 'userTags', 'wearCount'],
    });

    // 2. Build intelligent query based on wardrobe
    const query = youcomService.buildFashionQuery(wardrobe, occasion);
    const logger = require('../utils/logger');
    logger.info(`[FashionResearch] Query: ${query}`);

    // 3. Call You.com API with freshness for latest trends
    const searchData = await youcomService.search(query, {
      num_results: 20,
      freshness: 'week',
    });

    // 4. Extract structured trends (use trendAnalyzer for richer extraction)
    const trends = trendAnalyzer.extractTrends(searchData);

    // 5. Score each wardrobe item for trendiness
    const scoredItems = wardrobe.map((item) => ({
      itemId: item.id,
      attributes: item.extractedAttributes,
      tags: item.userTags,
      trendScore: trendAnalyzer.scoreItemTrendiness(item, trends),
    }));

    // 6. Generate personalized trend insights
    const insights = this._generateInsights(scoredItems, trends, wardrobe);

    return {
      query,
      trends,
      scoredItems,
      insights,
    };
  }

  /**
   * Generate human-readable insights.
   * @private
   */
  _generateInsights(scoredItems, trends, wardrobe) {
    const avgTrendScore =
      scoredItems.length > 0
        ? scoredItems.reduce((sum, i) => sum + i.trendScore, 0) / scoredItems.length
        : 0;

    const insights = [];

    if (scoredItems.length === 0) {
      insights.push('Add items to your wardrobe to get personalized trend insights.');
      return insights;
    }

    if (avgTrendScore > 0.7) {
      insights.push('Your wardrobe is super trendy! Keep rocking those styles.');
    } else if (avgTrendScore < 0.3) {
      insights.push('Your wardrobe has a classic vibe. Consider adding some trending pieces.');
    } else {
      insights.push('Your wardrobe has a good mix of classic and trendy items.');
    }

    if (trends.trendingColors.length > 0) {
      insights.push(`Hot colors right now: ${trends.trendingColors.slice(0, 5).join(', ')}.`);
    }
    if (trends.trendingCategories.length > 0) {
      insights.push(`Trending categories: ${trends.trendingCategories.slice(0, 3).join(', ')}.`);
    }

    // Suggest items to add based on missing trends
    const missingCategories = trends.trendingCategories.filter(
      (cat) => !wardrobe.some((i) => i.extractedAttributes?.category === cat)
    );
    if (missingCategories.length) {
      insights.push(`You might want to explore: ${missingCategories.slice(0, 3).join(', ')}.`);
    }

    return insights;
  }

  /**
   * Get outfit recommendations that combine user's items with trends.
   * @param {string} userId
   * @param {number} limit
   * @returns {Promise<Array>} Outfit suggestions with trend scores
   */
  async getTrendAwareOutfits(userId, limit = 5) {
    const research = await this.researchUserFashion(userId);
    const wardrobe = await WardrobeItem.findAll({ where: { userId } });

    const getAttr = (item, key) => item.extractedAttributes?.[key];
    const tops = wardrobe.filter((i) => getAttr(i, 'category') === 'top');
    const bottoms = wardrobe.filter((i) => getAttr(i, 'category') === 'bottom');
    const dresses = wardrobe.filter((i) => getAttr(i, 'category') === 'dress');

    const candidates = [];
    const itemScores = new Map(research.scoredItems.map((i) => [i.itemId, i.trendScore]));

    dresses.forEach((dress) => {
      const score = itemScores.get(dress.id) || 0;
      candidates.push({
        items: [dress.id],
        trendScore: score,
      });
    });

    tops.forEach((top) => {
      bottoms.forEach((bottom) => {
        const score = (itemScores.get(top.id) || 0) + (itemScores.get(bottom.id) || 0) / 2;
        candidates.push({
          items: [top.id, bottom.id],
          trendScore: score,
        });
      });
    });

    // Fallback: if no category matches, use any items
    if (candidates.length === 0 && wardrobe.length > 0) {
      if (wardrobe.length >= 2) {
        candidates.push({
          items: [wardrobe[0].id, wardrobe[1].id],
          trendScore:
            (itemScores.get(wardrobe[0].id) || 0) + (itemScores.get(wardrobe[1].id) || 0) / 2,
        });
      } else {
        candidates.push({
          items: [wardrobe[0].id],
          trendScore: itemScores.get(wardrobe[0].id) || 0,
        });
      }
    }

    candidates.sort((a, b) => b.trendScore - a.trendScore);
    return candidates.slice(0, limit);
  }
}

module.exports = new FashionResearchService();
