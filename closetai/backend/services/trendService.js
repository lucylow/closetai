/**
 * Fashion Trend Research Service
 * Uses You.com Search API for real-time fashion trend research with citations.
 * Caches results (NodeCache + Redis) to reduce API usage. Exposes rateInfo for judges.
 */
const NodeCache = require('node-cache');
const path = require('path');
const fs = require('fs');
const { search: youcomSearch } = require('../lib/youcomClient');
const { redisGet, redisSet } = require('../lib/cache');

const CACHE_TTL = Number(process.env.TREND_CACHE_TTL_SECONDS || 60 * 60 * 6); // 6 hours
const cache = new NodeCache({ stdTTL: CACHE_TTL });

const FASHION_KEYWORDS = [
  'trend', 'collection', 'runway', 'must-have', 'popular', 'coming back', 'in vogue',
  'fashion', 'style', 'wear', 'outfit', 'designer', 'season', 'spring', 'summer', 'fall', 'winter',
];

const AUTHORITATIVE_DOMAINS = ['vogue.com', 'wwd.com', 'bof.com', 'elle.com', 'harpersbazaar.com'];

const FASHION_TERMS = [
  'minimalist', 'maximalist', 'vintage', 'retro', 'modern', 'casual', 'formal',
  'bohemian', 'athleisure', 'streetwear', 'sustainable', 'ethical', 'vegan', 'organic',
];

function getFaviconUrl(url) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

function loadFallbackFixtures() {
  const fixturesPath = path.join(__dirname, '../fixtures/trends.json');
  try {
    if (fs.existsSync(fixturesPath)) {
      const raw = fs.readFileSync(fixturesPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load fixtures/trends.json:', e.message);
  }
  return null;
}

/**
 * Fetch current fashion trends with citations.
 * @param {Object} opts - { category, season, limit, force, query }
 * @param {string} opts.query - Optional raw search query (overrides category-based query)
 * @returns {Promise<{ query, timestamp, trends, sources, meta }>}
 */
async function fetchTrends({ category = 'all', season = null, limit = 10, force = false, query: rawQuery } = {}) {
  const now = new Date().toISOString();
  const cacheKey = `yt:trends:${category}:${season || 'any'}:${rawQuery || ''}`;

  if (!force) {
    const memCached = cache.get(cacheKey);
    if (memCached) return memCached;

    const redisCached = await redisGet(cacheKey);
    if (redisCached) {
      cache.set(cacheKey, redisCached);
      return redisCached;
    }
  }

  const resolvedSeason = season || _getCurrentSeason();
  const query = rawQuery || _buildQuery(category, resolvedSeason);

  try {
    const { data, rateInfo } = await youcomSearch(query, {
      count: limit,
      freshness: 'week',
    });

    const web = data?.results?.web || [];
    const trends = web.map((item) => {
      const url = item.url || '';
      const source = url ? (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return 'fashion'; } })() : 'fashion';
      const favicon = item.favicon_url || getFaviconUrl(url);
      return {
        title: item.title || '',
        description: item.description || item.snippet || '',
        url,
        snippet: (item.snippets && item.snippets[0]) || item.description || '',
        source,
        favicon,
        relevance: _computeRelevance(item),
        insights: _buildInsights(item),
      };
    });

    const sources = trends.map((t) => ({ url: t.url, title: t.title, favicon: t.favicon, date: null }));

    const payload = {
      query,
      timestamp: now,
      trends,
      sources,
      meta: { rateInfo },
    };

    cache.set(cacheKey, payload);
    await redisSet(cacheKey, payload, CACHE_TTL);

    return payload;
  } catch (err) {
    if (err?.code === 'NO_API_KEY' || err?.response?.status === 401) {
      return _getFallbackTrends(category, now);
    }
    const fixtures = loadFallbackFixtures();
    if (fixtures) return fixtures;
    return _getFallbackTrends(category, now);
  }
}

function _buildQuery(category, season) {
  const year = new Date().getFullYear();
  const queries = {
    all: () => `latest fashion trends ${year}`,
    clothing: (s) => `clothing fashion trends ${s} ${year}`,
    colors: (s) => `fashion color trends ${s} ${year}`,
    accessories: (s) => `accessory trends ${s} ${year}`,
    sustainable: () => `sustainable fashion trends ${year}`,
  };
  const fn = queries[category] || queries.all;
  return typeof fn === 'function' ? fn(season) : queries.all();
}

function _computeRelevance(item) {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  let score = 0;
  FASHION_KEYWORDS.forEach((k) => { if (text.includes(k)) score += 15; });
  if (/vogue|wwd|elle|harpersbazaar|bof|business of fashion/i.test(item.url || '')) score += 30;
  return Math.min(score, 100);
}

function _buildInsights(item) {
  const snippet = item.description || item.snippet || '';
  if (!snippet) return [];
  return [{
    text: snippet,
    confidence: AUTHORITATIVE_DOMAINS.some((d) => (item.url || '').includes(d)) ? 0.8 : 0.5,
    keywords: FASHION_TERMS.filter((t) => snippet.toLowerCase().includes(t)),
  }];
}

function _getFallbackTrends(category, timestamp) {
  const fallbackTrends = {
    colors: ['Sage Green', 'Dusty Lavender', 'Warm Terracotta', 'Classic Navy'],
    clothing: ['Oversized Blazers', 'Wide-Leg Trousers', 'Knit Vests', 'Leather Midi Skirts'],
    accessories: ['Chunky Jewelry', 'Oversized Bags', 'Statement Belts'],
    sustainable: ['Upcycled Denim', 'Organic Cotton Basics', 'Vintage Shopping'],
    all: ['Oversized Blazers', 'Wide-Leg Trousers', 'Sustainable Linen', '90s Vintage', 'Monochrome Layering'],
  };

  const items = fallbackTrends[category] || fallbackTrends.all;
  const trends = items.map((name, i) => ({
    title: name,
    description: `Trending in ${category} fashion.`,
    url: 'https://you.com/hackathon',
    snippet: '',
    source: 'you.com',
    favicon: 'https://you.com/favicon.ico',
    relevance: 80 - i * 5,
    insights: [],
  }));

  return {
    query: `fallback trends ${category}`,
    timestamp: timestamp || new Date().toISOString(),
    trends,
    sources: [{ url: 'https://you.com/hackathon', title: 'You.com Hackathon Resources', favicon: null, date: null }],
    meta: { fallback: true },
  };
}

function _getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Legacy alias for getCurrentTrends compatibility.
 */
async function getCurrentTrends(category = 'all', season = null, limit = 10) {
  const result = await fetchTrends({ category, season, limit, force: false });
  // Normalize to legacy shape (relevance_score, etc.)
  return {
    query: result.query,
    timestamp: result.timestamp,
    trends: result.trends.map((t) => ({
      title: t.title,
      description: t.description,
      insights: t.insights || [],
      url: t.url,
      source: t.source,
      relevance_score: t.relevance ?? 70,
      favicon: t.favicon,
    })),
    sources: result.sources,
    meta: result.meta,
  };
}

module.exports = {
  fetchTrends,
  getCurrentTrends,
};
