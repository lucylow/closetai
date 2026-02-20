/**
 * Cached Trend Service
 * Caches You.com fashion trend results for 6 hours to reduce API calls.
 */
const NodeCache = require('node-cache');
const youcomService = require('./youcom.service');
const trendService = require('./trendService');

const trendCache = new NodeCache({ stdTTL: 21600 }); // 6 hours

class CachedTrendService {
  /**
   * Get fashion trends with citations (cached).
   * @param {string} category - e.g. 'fashion', 'streetwear', 'all'
   * @returns {Promise<{ trends: Array, citations: Array }>}
   */
  async getTrendsWithCitations(category = 'fashion') {
    const cacheKey = `trends_citations_${category}`;
    let cached = trendCache.get(cacheKey);
    if (cached) return cached;

    const result = await youcomService.getFashionTrendsWithCitations(category, 15);
    trendCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get trends in trendService format (cached).
   * Uses existing trendService which has its own cache; this adds a longer TTL layer.
   * @param {Object} opts - { category, season, limit, force }
   * @returns {Promise<Object>}
   */
  async getTrends(opts = {}) {
    const { category = 'all', season = null, limit = 20, force = false } = opts;
    const cacheKey = `trends_${category}_${season || 'any'}`;
    if (!force) {
      const cached = trendCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await trendService.fetchTrends({ category, season, limit, force });
    trendCache.set(cacheKey, result);
    return result;
  }

  /**
   * Invalidate cache (e.g. when trends need refresh).
   */
  invalidate() {
    trendCache.flushAll();
  }
}

module.exports = new CachedTrendService();
