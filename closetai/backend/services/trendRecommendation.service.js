/**
 * Trend-Aware Recommendation Engine
 * Scores wardrobe items against You.com real-time fashion trends and generates
 * outfit combinations with trend insights and citations.
 */
const trendService = require('./trendService');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const trendCache = new Map();

class TrendRecommendationEngine {
  /**
   * Get trend-aware outfit recommendations
   * @param {string} userId - User ID or 'anonymous'
   * @param {Array} wardrobe - Array of wardrobe items with extractedAttributes
   * @param {string} occasion - casual | formal | party | work
   * @param {Object} weather - { condition, temp }
   */
  async getTrendAwareRecommendations(userId, wardrobe, occasion = 'casual', weather = {}) {
    const trends = await this._getCachedTrends();
    const scoredItems = await this._scoreItemsByTrend(wardrobe, trends);
    const outfits = this._generateOutfits(scoredItems, occasion, weather);

    return {
      outfits,
      trendInsights: this._extractTrendInsights(trends),
      timestamp: new Date().toISOString(),
      citation: 'Trend data sourced from You.com real-time search',
    };
  }

  async _getCachedTrends() {
    const cacheKey = 'fashion-trends';
    const cached = trendCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const trends = await trendService.getCurrentTrends('all', null, 15);
    trendCache.set(cacheKey, { data: trends, timestamp: Date.now() });
    return trends;
  }

  _scoreItemsByTrend(wardrobe, trends) {
    const scoredItems = [];
    const trendList = trends.trends || [];

    for (const item of wardrobe) {
      const attrs = item.extractedAttributes || {};
      let trendScore = 0;
      const matchedTrends = [];

      for (const trend of trendList) {
        const relevance = this._checkTrendRelevance(item, trend);
        if (relevance > 0) {
          trendScore += relevance;
          matchedTrends.push({
            trend: trend.title,
            relevance,
            source: trend.url,
            favicon: trend.favicon,
            title: trend.title,
          });
        }
      }

      scoredItems.push({
        ...item,
        trendScore: Math.min(trendScore, 100),
        matchedTrends,
        recommendations: this._generateItemRecommendations(item, matchedTrends),
      });
    }

    return scoredItems.sort((a, b) => b.trendScore - a.trendScore);
  }

  _checkTrendRelevance(item, trend) {
    const attrs = item.extractedAttributes || {};
    const itemText = `${attrs.category || ''} ${attrs.color || ''} ${attrs.pattern || ''} ${attrs.style || ''}`.toLowerCase();
    const trendText = `${trend.title || ''} ${trend.description || ''} ${(trend.insights || []).map((i) => i.text).join(' ')}`.toLowerCase();

    let score = 0;
    if (attrs.color && trendText.includes(attrs.color.toLowerCase())) score += 30;
    if (attrs.category && trendText.includes(attrs.category.toLowerCase())) score += 20;
    if (attrs.style && trendText.includes(attrs.style.toLowerCase())) score += 25;
    if (attrs.pattern && trendText.includes(attrs.pattern.toLowerCase())) score += 15;

    return score;
  }

  _generateOutfits(scoredItems, occasion, weather) {
    const outfits = [];
    const getAttr = (i, k) => i.extractedAttributes?.[k];
    const tops = scoredItems.filter((i) => getAttr(i, 'category') === 'top');
    const bottoms = scoredItems.filter((i) => getAttr(i, 'category') === 'bottom');
    const dresses = scoredItems.filter((i) => getAttr(i, 'category') === 'dress');
    const outerwear = scoredItems.filter((i) => getAttr(i, 'category') === 'outerwear');
    const accessories = scoredItems.filter((i) => getAttr(i, 'category') === 'accessory');

    for (const top of tops.slice(0, 3)) {
      for (const bottom of bottoms.slice(0, 3)) {
        const comboScore = (top.trendScore + bottom.trendScore) / 2;
        outfits.push({
          items: [top, bottom],
          trendScore: Math.round(comboScore),
          occasion: this._checkOccasionFit([top, bottom], occasion),
          weather: this._checkWeatherFit([top, bottom], weather),
          matchedTrends: this._dedupeTrends([...(top.matchedTrends || []), ...(bottom.matchedTrends || [])]),
        });
      }
    }

    dresses.slice(0, 3).forEach((dress) => {
      outfits.push({
        items: [dress],
        trendScore: Math.round(dress.trendScore),
        occasion: this._checkOccasionFit([dress], occasion),
        weather: this._checkWeatherFit([dress], weather),
        matchedTrends: dress.matchedTrends || [],
      });
    });

    return outfits
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);
  }

  _dedupeTrends(trends) {
    const seen = new Set();
    return trends.filter((t) => {
      const key = t.trend || t.keyword;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _extractTrendInsights(trends) {
    const details = [];
    const trendList = trends.trends || [];
    trendList.slice(0, 5).forEach((trend) => {
      const insight = trend.insights?.[0]?.text || trend.description;
      if (insight) {
        details.push({ trend: trend.title, insight, source: trend.url });
      }
    });

    return {
      summary: `Based on current fashion trends from ${(trends.sources || []).length} sources`,
      details,
      lastUpdated: trends.timestamp,
    };
  }

  _checkOccasionFit(items, occasion) {
    const keywords = {
      casual: ['casual', 'everyday', 'comfortable'],
      formal: ['formal', 'elegant', 'sophisticated'],
      party: ['party', 'night out', 'festive'],
      work: ['professional', 'business', 'office'],
    };
    const kws = keywords[occasion] || keywords.casual;
    const text = items.map((i) => `${i.extractedAttributes?.style || ''} ${i.extractedAttributes?.category || ''}`).join(' ').toLowerCase();
    return kws.some((kw) => text.includes(kw)) ? 'perfect' : 'good';
  }

  _checkWeatherFit(items, weather) {
    const conditions = {
      hot: ['short sleeve', 'tank top', 'light'],
      cold: ['long sleeve', 'sweater', 'jacket', 'coat'],
      rainy: ['raincoat', 'waterproof'],
    };
    const conds = conditions[weather?.condition] || [];
    const text = items.map((i) => `${i.extractedAttributes?.style || ''} ${i.extractedAttributes?.category || ''}`).join(' ').toLowerCase();
    return conds.some((c) => text.includes(c)) ? 'appropriate' : 'check weather';
  }

  _generateItemRecommendations(item, matchedTrends) {
    if (!matchedTrends?.length) return [];
    const attrs = item.extractedAttributes || {};
    return matchedTrends.map((t) => ({
      type: 'trend-alert',
      message: `Your ${attrs.color || ''} ${attrs.category || ''} is trending! ${t.trend}`,
      source: t.source,
    }));
  }
}

module.exports = new TrendRecommendationEngine();
