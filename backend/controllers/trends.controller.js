const youcomService = require('../services/youcom.service');
const trendSummarizer = require('../services/trendSummarizer.service');
const trendService = require('../services/trendService');
const recommendationEngine = require('../services/recommendationEngine');
const { WardrobeItem } = require('../models');
const { fetchTrends } = trendService;
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError } = require('../utils/errors');

/**
 * GET /api/trends
 * Fetch fashion trends from You.com API (or fallback when API key not configured)
 * When authenticated, includes personalized GPT-powered style tips
 */
const getTrends = asyncHandler(async (req, res) => {
  const query = req.query.q || req.query.query || 'latest fashion trends 2026';
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);

  const searchData = await youcomService.searchFashionTrends(query, limit);
  const extracted = youcomService.extractTrends(searchData);

  let trendList = searchData.fallback || extracted.trends;
  if (!trendList?.length && searchData.results?.web?.length) {
    trendList = searchData.results.web.slice(0, 6).map((w, i) => ({
        name: w.title?.slice(0, 40) || `Trend ${i + 1}`,
        score: 70 + Math.floor(Math.random() * 25),
        direction: i < 3 ? 'up' : i < 5 ? 'stable' : 'down',
      description: w.description?.slice(0, 120) || 'Trending in fashion.',
    }));
  }
  const trends = (trendList || []).map((t, i) => ({
      name: typeof t === 'string' ? t : t.name,
      score: typeof t === 'object' && t.score != null ? t.score : 70 + Math.floor(Math.random() * 25),
      direction: typeof t === 'object' && t.direction ? t.direction : (i < 3 ? 'up' : i < 5 ? 'stable' : 'down'),
      description: typeof t === 'object' && t.description ? t.description : 'Trending in fashion.',
    }));

  const sources = searchData.results?.web?.slice(0, 5).map((w) => ({
    url: w.url,
    title: w.title,
    snippet: w.description || '',
  })) || [
    { url: 'https://www.vogue.com', title: 'Vogue: Fashion Trends', snippet: 'The biggest trends for the season.' },
    { url: 'https://www.elle.com', title: "Elle: What's In", snippet: 'From runways to your closet.' },
  ];

  let insights = extracted.trendingColors?.length
    ? [
        `Hot colors right now: ${extracted.trendingColors.slice(0, 4).join(', ')}.`,
        extracted.keywords?.length ? `Trending: ${extracted.keywords.slice(0, 3).join(', ')}.` : 'Stay ahead with these styles.',
      ]
    : [
        'Your wardrobe has a good mix of classic and trendy items.',
        'Sustainable fashion continues to gain traction.',
      ];

  // Personalized GPT tips when user is authenticated
  if (req.user?.id) {
    try {
      const wardrobe = await WardrobeItem.findAll({ where: { userId: req.user.id }, limit: 30 });
      const trendsData = { trends: trendList, trendingColors: extracted.trendingColors, keywords: extracted.keywords, fallback: searchData.fallback };
      const personalizedTips = await trendSummarizer.summarizeTrends(trendsData, wardrobe);
      if (personalizedTips?.length) {
        insights = [...personalizedTips, ...insights.slice(0, 1)];
      }
    } catch (e) {
      // Keep default insights on error
    }
  }

  res.json({
    trends,
    sources,
    insights,
    query,
    fromApi: !!searchData.results?.web?.length,
  });
});

/**
 * GET /api/trends/with-citations
 * Fetch fashion trends with full citation details (title, URL, snippet, source)
 */
const getTrendsWithCitations = asyncHandler(async (req, res) => {
  const category = req.query.category || 'fashion';
  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 25);
  const result = await youcomService.getFashionTrendsWithCitations(category, limit);
  res.json(result);
});

/**
 * GET /api/trends/fashion
 * Get current fashion trends by category (all, clothing, colors, accessories, sustainable)
 * Query: category, season, limit, force (true to bypass cache)
 */
const getFashionTrends = asyncHandler(async (req, res) => {
  const { category = 'all', season, limit = 12, force = 'false' } = req.query;
  const data = await fetchTrends({
    category,
    season: season || null,
    limit: Math.min(parseInt(limit, 10) || 12, 25),
    force: force === 'true',
  });
  res.json({
    success: true,
    data,
    meta: {
      category,
      source: 'You.com API',
      rateInfo: data.meta?.rateInfo,
      fallback: data.meta?.fallback,
    },
  });
});

/**
 * POST /api/trends/outfits/trend-aware
 * Get trend-aware outfit recommendations (works with or without auth)
 * Uses recommendationEngine: You.com trends + weighted scoring (trend/style/occasion/weather)
 */
const getTrendAwareOutfits = asyncHandler(async (req, res) => {
  const { wardrobe, occasion = 'casual', weather = {} } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!wardrobe || !Array.isArray(wardrobe)) {
    throw new BadRequestError('wardrobe array is required');
  }

  const result = await recommendationEngine.getTrendAwareRecommendations(userId, wardrobe, {
    occasion,
    weather: weather && typeof weather === 'object' ? weather : { condition: 'any' },
    userPrefs: null,
  });

  // Transform to frontend shape: outfits with trendScore, matchedTrends (trend, source, favicon)
  const outfits = (result.outfits || []).map((o) => ({
    items: o.items.map((i) => ({
      id: i.id,
      imageUrl: i.imageUrl,
      name: i.name,
      category: i.category,
      color: i.color,
      extractedAttributes: { category: i.category, color: i.color },
      trendScore: o.score,
    })),
    trendScore: o.score,
    occasion: o.occasion || occasion,
    weather: o.weather?.condition ? `${o.weather.condition}` : 'any',
    matchedTrends: (o.matchedTrends || []).map((t) => ({
      trend: t.trend,
      source: t.url,
      favicon: t.favicon,
      relevance: t.relevance,
    })),
    reason: o.reason,
  }));

  const trendInsights = {
    summary: result.trendInsights?.summary || 'Recommendations informed by live fashion trends.',
    details: (result.trendInsights?.details || []).map((d) => ({
      trend: d.title,
      insight: d.title,
      source: d.url,
      relevance: d.relevance,
    })),
    lastUpdated: result.trendInsights?.fetchedAt,
  };

  res.json({
    success: true,
    data: {
      outfits,
      trendInsights,
      citation: 'Trend data sourced from You.com real-time search',
    },
    meta: {
      userId,
      wardrobeSize: wardrobe.length,
      timestamp: result.generatedAt,
    },
  });
});

/**
 * GET /api/trends/search
 * Search for specific fashion trends via You.com (proxy for inspect-source flow)
 */
const searchTrends = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) {
    throw new BadRequestError('Search query (q) required');
  }
  const data = await fetchTrends({
    category: 'search',
    query: q,
    season: null,
    limit: Math.min(parseInt(limit, 10) || 10, 30),
    force: false,
  });
  res.json({
    success: true,
    data,
    meta: { api: 'You.com Search API', rateInfo: data.meta?.rateInfo },
  });
});

module.exports = {
  getTrends,
  getTrendsWithCitations,
  getFashionTrends,
  getTrendAwareOutfits,
  searchTrends,
};
