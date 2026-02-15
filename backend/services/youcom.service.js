const axios = require('axios');
const env = require('../config/env');

const FALLBACK_TRENDS = [
  { name: 'Oversized Blazers', score: 94, direction: 'up', description: 'Relaxed tailoring dominates.' },
  { name: 'Wide-Leg Trousers', score: 88, direction: 'up', description: 'Comfort meets elegance.' },
  { name: 'Sustainable Linen', score: 82, direction: 'up', description: 'Eco-conscious fabrics trending.' },
  { name: '90s Vintage', score: 79, direction: 'stable', description: 'Nostalgic aesthetics remain.' },
  { name: 'Monochrome Layering', score: 73, direction: 'up', description: 'Single-color outfits trending.' },
];

class YouComService {
  constructor() {
    this.baseURL = 'https://api.ydc-index.io/v1';
  }

  /**
   * Perform a search with optional filters.
   * @param {string} query - Search query
   * @param {Object} options - { num_results, freshness, site }
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    if (!env.youcom?.apiKey) {
      return { results: { web: [] }, fallback: FALLBACK_TRENDS };
    }
    try {
      const params = {
        query,
        num_results: options.num_results || 10,
        ...(options.freshness && { freshness: options.freshness }),
        ...(options.site && { site: options.site }),
      };
      const response = await axios.get(`${this.baseURL}/search`, {
        headers: { 'X-API-Key': env.youcom.apiKey },
        params,
      });
      return response.data;
    } catch (e) {
      return { results: { web: [] }, fallback: FALLBACK_TRENDS };
    }
  }

  /**
   * Build a context-aware fashion query based on user's wardrobe.
   * @param {Array} wardrobeItems - List of user's clothing items
   * @param {string} occasion - e.g., 'casual', 'party'
   * @returns {string} Optimized search query
   */
  buildFashionQuery(wardrobeItems, occasion = null) {
    const colors = [...new Set(wardrobeItems.map((i) => i.extractedAttributes?.color).filter(Boolean))];
    const categories = [...new Set(wardrobeItems.map((i) => i.extractedAttributes?.category).filter(Boolean))];
    const styles = [...new Set(wardrobeItems.map((i) => i.extractedAttributes?.style).filter(Boolean))];

    const parts = [];
    if (occasion) parts.push(`${occasion} fashion`);
    parts.push('trends');
    if (colors.length) parts.push(`colors: ${colors.slice(0, 3).join(' ')}`);
    if (categories.length) parts.push(`categories: ${categories.slice(0, 3).join(' ')}`);
    if (styles.length) parts.push(`styles: ${styles.slice(0, 3).join(' ')}`);
    parts.push(new Date().getFullYear());

    return parts.join(' ');
  }

  async searchFashionTrends(query = 'latest fashion trends', limit = 10) {
    if (!env.youcom?.apiKey) {
      return { results: { web: [] }, fallback: FALLBACK_TRENDS };
    }
    try {
      const response = await axios.get('https://api.ydc-index.io/v1/search', {
        headers: { 'X-API-Key': env.youcom.apiKey },
        params: { query, num_results: limit },
      });
      return response.data;
    } catch (e) {
      return { results: { web: [] }, fallback: FALLBACK_TRENDS };
    }
  }

  extractTrends(searchData) {
    if (searchData.fallback) {
      return {
        trendingColors: ['navy', 'sage', 'terracotta', 'cream', 'black'],
        keywords: searchData.fallback.map(t => t.name),
        trends: searchData.fallback,
      };
    }
    const trendingColors = [];
    const keywords = [];
    if (searchData.results?.web) {
      searchData.results.web.forEach((item) => {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        const colorMatches = text.match(/\b(red|blue|green|yellow|purple|orange|black|white|gray|pink|brown|beige|navy|teal|sage|lavender|terracotta)\b/g);
        if (colorMatches) trendingColors.push(...colorMatches);
        if (text.includes('trend')) keywords.push(item.title);
      });
    }
    return {
      trendingColors: [...new Set(trendingColors)].slice(0, 10),
      keywords: [...new Set(keywords)].slice(0, 5),
    };
  }

  /**
   * Search for fashion trends and return enriched results with citations.
   * @param {string} category - e.g. 'fashion', 'streetwear'
   * @param {number} limit - max number of results
   * @returns {Promise<{ trends: Array, citations: Array }>}
   */
  async getFashionTrendsWithCitations(category = 'fashion', limit = 15) {
    const data = await this.search(
      `latest ${category} trends ${new Date().getFullYear()}`,
      { num_results: limit, freshness: 'week' }
    );

    const trends = [];
    const citations = [];

    if (data.fallback) {
      data.fallback.forEach((item, index) => {
        const citation = {
          id: `cit-fb-${index}`,
          title: item.name,
          url: 'https://www.vogue.com/fashion-trends',
          snippet: item.description || '',
          favicon: null,
          publishedDate: null,
          source: 'vogue.com',
        };
        citations.push(citation);
        trends.push({
          keyword: item.name,
          title: item.name,
          description: item.description,
          citationId: citation.id,
          relevanceScore: (item.score || 70) / 100,
        });
      });
      return { trends, citations };
    }

    if (data.results?.web) {
      data.results.web.forEach((item, index) => {
        let source = 'fashion';
        try {
          if (item.url) source = new URL(item.url).hostname.replace('www.', '');
        } catch {
          // keep default
        }
        const citation = {
          id: `cit-${index}`,
          title: item.title || '',
          url: item.url || '',
          snippet: item.description || item.snippet || '',
          favicon: item.favicon_url || null,
          publishedDate: item.page_age || null,
          source,
        };
        citations.push(citation);

        const trendText = (item.title + ' ' + (item.description || item.snippet || '')).toLowerCase();
        const trendKeywords = this._extractTrendKeywords(trendText);
        trends.push({
          keyword: trendKeywords[0] || 'fashion',
          title: item.title || '',
          description: item.description || item.snippet || '',
          citationId: citation.id,
          relevanceScore: item.relevance_score ?? 0.5,
        });
      });
    }

    return { trends, citations };
  }

  /**
   * Build a search query for styling advice based on an item and optional context.
   * @param {Object} item - Wardrobe item with extractedAttributes
   * @param {Object} context - { occasion, vibe }
   * @returns {string} Optimized search query for styling advice
   */
  buildStylingQuery(item, context = {}) {
    const attrs = item.extractedAttributes || {};
    const parts = [];

    const description = [
      attrs.color,
      attrs.pattern,
      attrs.category,
      attrs.style,
    ].filter(Boolean).join(' ');

    parts.push(`how to style a ${description || 'clothing item'}`);

    if (context.occasion) {
      parts.push(`for ${context.occasion}`);
    }
    if (context.vibe) {
      parts.push(`${context.vibe} look`);
    }
    parts.push(new Date().getFullYear());
    parts.push('outfit ideas', 'styling tips', 'fashion blog');

    return parts.join(' ');
  }

  /**
   * Search for styling advice and return results with citations.
   * @param {Object} item - Wardrobe item
   * @param {Object} context - { occasion, vibe }
   * @returns {Promise<{ query: string, advice: Array, citations: Array }>}
   */
  async getStylingAdvice(item, context = {}) {
    const query = this.buildStylingQuery(item, context);
    const searchResults = await this.search(query, {
      num_results: 12,
      freshness: 'month',
    });

    const advice = [];
    const citations = [];

    if (searchResults.fallback) {
      searchResults.fallback.forEach((fb, idx) => {
        const citation = {
          id: `cit-fb-${idx}`,
          title: fb.name,
          url: 'https://www.vogue.com/fashion-trends',
          snippet: fb.description || '',
          source: 'vogue.com',
          favicon: null,
        };
        citations.push(citation);
        advice.push({
          citationId: citation.id,
          tips: [fb.description || 'Explore this trend for styling inspiration.'],
        });
      });
      return { query, advice, citations };
    }

    if (searchResults.results?.web) {
      searchResults.results.web.forEach((res, idx) => {
        let source = 'fashion';
        try {
          if (res.url) source = new URL(res.url).hostname.replace('www.', '');
        } catch {
          // keep default
        }
        const citation = {
          id: `cit-${idx}`,
          title: res.title || '',
          url: res.url || '',
          snippet: res.description || res.snippet || '',
          source,
          favicon: res.favicon_url || null,
        };
        citations.push(citation);

        const tips = this._extractTips(res.description || res.snippet || '');
        advice.push({
          citationId: citation.id,
          tips: tips.length ? tips : [res.description || res.snippet || ''],
        });
      });
    }

    return { query, advice, citations };
  }

  /**
   * Extract bullet-point style tips from a snippet (basic heuristic).
   */
  _extractTips(text) {
    if (!text) return [];
    const sentences = text.split(/[.!?]+/);
    const tipKeywords = [
      'wear', 'pair', 'style', 'match', 'combine', 'try', 'accessorize', 'layer',
    ];
    return sentences
      .filter((s) => tipKeywords.some((kw) => s.toLowerCase().includes(kw)))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  /**
   * Extract top trend keyword from text (basic NLP).
   */
  _extractTrendKeywords(text) {
    const commonTrendWords = [
      'trend', 'style', 'fashion', 'wear', 'outfit', 'look', 'season',
      'spring', 'summer', 'fall', 'winter', 'color', 'pattern', 'silhouette',
      'blazer', 'trousers', 'linen', 'vintage', 'monochrome', 'layering',
    ];
    const words = text.split(/\W+/);
    const found = words.filter((w) => commonTrendWords.includes(w) && w.length > 2);
    return found.length ? found : ['fashion'];
  }
}

module.exports = new YouComService();
