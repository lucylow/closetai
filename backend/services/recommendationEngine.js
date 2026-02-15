// backend/services/recommendationEngine.js
/**
 * Recommendation engine that:
 *  - Fetches current trends via trendService (You.com)
 *  - Scores wardrobe items against trends
 *  - Builds outfit combinations (top+bottom, dress, optional outerwear/accessory)
 *  - Ranks outfits by combined score
 *  - Returns explainable results: matched trends + source URLs
 *
 * Dependencies:
 *  - services/trendService.js  (exports fetchTrends({category, season, limit, force}))
 *
 * Usage:
 *  const rec = require('./services/recommendationEngine');
 *  const result = await rec.getTrendAwareRecommendations(userId, wardrobe, { occasion, weather });
 */

const trendService = require('./trendService');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 * 60 * 6 }); // 6h cache for trends + scoring
const debug = require('debug')('closet:recommendation');

// configurable weights (tune in one place)
const WEIGHTS = {
  trendMatch: 0.50,     // how much trending content matters
  styleMatch: 0.20,     // how well items go together (color/contrast rules)
  occasionMatch: 0.15,  // how well outfit fits occasion
  weatherMatch: 0.10,   // weather appropriateness
  userPref: 0.05        // user's explicit preferences
};

// limits
const MAX_OUTFITS_RETURN = 10;
const MAX_ITEMS_TO_CONSIDER = 30; // to limit combinatorial explosion

// simple color synonyms map for fuzzy matching
const COLOR_SYNONYMS = {
  navy: ['navy', 'navy blue', 'midnight blue'],
  black: ['black'],
  white: ['white', 'off-white', 'ivory', 'cream'],
  red: ['red', 'crimson', 'maroon'],
  blue: ['blue', 'denim', 'indigo'],
  brown: ['brown', 'camel', 'tan', 'beige'],
  gray: ['gray', 'grey', 'charcoal'],
  pink: ['pink', 'blush', 'rose'],
  green: ['green', 'sage', 'olive'],
  // add more as needed
};

// utility: normalize text
function normalizeText(s = '') {
  return s.toString().trim().toLowerCase();
}

// gets tokens/keywords from text (very simple; you can plug in a tokenizer or NLP lib)
function extractKeywords(text) {
  if (!text) return [];
  const cleaned = normalizeText(text).replace(/[^a-z0-9\s-]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  // remove common stopwords (short list)
  const stop = new Set(['the','and','a','in','on','for','with','to','of','is','are','by','new','latest']);
  return [...new Set(tokens.filter(t => !stop.has(t) && t.length > 2))];
}

// match color fuzzy
function colorMatches(itemColor, trendText) {
  if (!itemColor) return false;
  const norm = normalizeText(itemColor);
  for (const [key, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    if (synonyms.some(s => norm.includes(s) || trendText.includes(s))) return true;
  }
  // fallback: direct substring
  return trendText.includes(norm);
}

// normalize wardrobe item to engine format (handles extractedAttributes from API)
function normalizeWardrobeItem(item) {
  const attrs = item.extractedAttributes || {};
  return {
    id: item.id,
    category: (attrs.category || item.category || '').toLowerCase(),
    color: attrs.color || item.color || '',
    style: attrs.style || item.style || '',
    pattern: attrs.pattern || item.pattern || '',
    imageUrl: item.imageUrl || item.image,
    tags: item.userTags || item.tags || [],
    wear_count: item.wearCount ?? item.wear_count ?? 0,
    name: item.name,
  };
}

// compute item vs trend relevance (0..100)
function computeItemTrendRelevance(item, trend) {
  const trendText = normalizeText(`${trend.title} ${trend.description} ${trend.snippet || ''}`);
  let score = 0;

  // 1) category match (top/bottom/dress/outerwear/accessory)
  if (item.category && trendText.includes(item.category.toLowerCase())) score += 30;

  // 2) color match (fuzzy)
  if (colorMatches(item.color, trendText)) score += 20;

  // 3) style/keywords match
  if (item.style) {
    const style = normalizeText(item.style);
    if (trendText.includes(style)) score += 20;
  }
  // 4) pattern match
  if (item.pattern && trendText.includes(normalizeText(item.pattern))) score += 10;

  // 5) keyword overlap between trend insights and item tags/description
  const itemText = normalizeText(`${item.category} ${item.color} ${item.style || ''} ${item.tags ? item.tags.join(' ') : ''}`);
  const trendKeywords = extractKeywords(trendText);
  const itemTokens = extractKeywords(itemText);
  const overlap = trendKeywords.filter(k => itemTokens.includes(k)).length;
  score += Math.min(20, overlap * 5);

  return Math.min(Math.round(score), 100);
}

// score every wardrobe item against array of trends and produce a combined trendScore
function scoreWardrobeAgainstTrends(wardrobe, trends) {
  // returns array of items augmented with { trendScore, matchedTrends: [...] }
  const items = wardrobe.slice(0, MAX_ITEMS_TO_CONSIDER).map(item => ({ ...item })); // shallow copy
  for (const item of items) {
    let aggregatedScore = 0;
    const matchedTrends = [];

    for (const trend of trends) {
      const rel = computeItemTrendRelevance(item, trend); // 0..100
      if (rel > 20) { // threshold to consider a match
        matchedTrends.push({ trend: trend.title, url: trend.url, relevance: rel, favicon: trend.favicon });
      }
      // weight by trend.relevance if provided
      const trendWeight = (trend.relevance || 50) / 100.0; // 0..1
      aggregatedScore += rel * trendWeight;
    }

    // normalize aggregated score by number of trends to keep in [0..100]
    const norm = trends.length ? aggregatedScore / trends.length : aggregatedScore;
    // combine with simple heuristics (prefer unworn items slightly to encourage reuse? configurable)
    const wearPenalty = item.wear_count ? Math.min(15, item.wear_count * 2) : 0; // penalize heavily-worn items
    const finalTrendScore = Math.max(0, Math.min(100, Math.round(norm - wearPenalty)));

    item.trendScore = finalTrendScore;
    item.matchedTrends = matchedTrends.sort((a,b) => b.relevance - a.relevance).slice(0,5);
  }
  // sort items by trendScore desc
  return items.sort((a,b) => b.trendScore - a.trendScore);
}

// helper: simple color-contrast + match rules for compatibility score (0..100)
function computePairCompatibility(a, b) {
  // very simple heuristics:
  // - same color family vs complementary
  const aColor = normalizeText(a.color || '');
  const bColor = normalizeText(b.color || '');
  let score = 50;

  if (!aColor || !bColor) { score = 50; }
  else if (aColor === bColor) score += 10;
  else if ((aColor.includes('black') && bColor.includes('white')) || (aColor.includes('white') && bColor.includes('black'))) score += 20;
  else if (aColor === 'navy' && bColor === 'white') score += 15;
  // pattern heuristics
  if (a.pattern && b.pattern && a.pattern === b.pattern) score -= 10; // avoid clashing exact patterns
  // style harmony
  if (a.style && b.style && a.style.toLowerCase() === b.style.toLowerCase()) score += 10;

  return Math.max(0, Math.min(100, score));
}

// simple occasion matching
function checkOccasionFit(items, occasion) {
  if (!occasion) return 0.5; // neutral
  const occasionMap = {
    casual: ['casual', 'everyday', 'street', 'relaxed'],
    formal: ['formal', 'business', 'elegant', 'cocktail', 'suit'],
    party: ['party', 'night', 'festive'],
    work: ['work', 'office', 'professional'],
    sport: ['sport', 'gym', 'athleisure']
  };
  const keywords = (occasionMap[occasion] || [occasion]).map(normalizeText);
  const text = items.map(i => normalizeText(`${i.category} ${i.style || ''} ${i.tags ? i.tags.join(' ') : ''}`)).join(' ');
  return keywords.some(k => text.includes(k)) ? 1.0 : 0.5;
}

// simple weather check
function checkWeatherFit(items, weather) {
  // weather: { condition: 'hot'|'cold'|'rainy'|'any', temp: number }
  if (!weather || weather.condition === 'any') return 1.0;
  const itemTexts = items.map(i => `${i.category} ${i.style || ''} ${i.tags ? i.tags.join(' ') : ''}`.toLowerCase()).join(' ');
  if (weather.condition === 'hot') {
    if (itemTexts.includes('short') || itemTexts.includes('tank') || itemTexts.includes('short sleeve') || itemTexts.includes('light')) return 1.0;
    return 0.6;
  }
  if (weather.condition === 'cold') {
    if (itemTexts.includes('jacket') || itemTexts.includes('coat') || itemTexts.includes('sweater')) return 1.0;
    return 0.6;
  }
  if (weather.condition === 'rainy') {
    if (itemTexts.includes('raincoat') || itemTexts.includes('waterproof')) return 1.0;
    return 0.6;
  }
  return 1.0;
}

// Build outfit combos and score them
function generateOutfitCombinations(scoredItems, options = {}) {
  const tops = scoredItems.filter(i => i.category === 'top');
  const bottoms = scoredItems.filter(i => i.category === 'bottom');
  const dresses = scoredItems.filter(i => i.category === 'dress');
  const outerwear = scoredItems.filter(i => i.category === 'outerwear');
  const accessories = scoredItems.filter(i => i.category === 'accessory');

  const maxPerList = 6; // consider only top N in each category to limit combos
  const topCandidates = tops.slice(0, maxPerList);
  const bottomCandidates = bottoms.slice(0, maxPerList);
  const dressCandidates = dresses.slice(0, maxPerList);

  const combos = [];

  // top + bottom combos
  for (const top of topCandidates) {
    for (const bottom of bottomCandidates) {
      const baseItems = [top, bottom];
      // optionally add outerwear/accessory best match
      const bestOuter = outerwear.length ? outerwear[0] : null;
      const bestAccessory = accessories.length ? accessories[0] : null;
      const fullItems = [...baseItems];
      if (bestOuter) fullItems.push(bestOuter);
      if (bestAccessory) fullItems.push(bestAccessory);

      // scores:
      const avgTrend = (top.trendScore + bottom.trendScore) / 2;
      const comp = computePairCompatibility(top, bottom); // 0..100
      const styleScore = comp; // reuse as styleMatch
      const occasionFactor = checkOccasionFit(fullItems, options.occasion);
      const weatherFactor = checkWeatherFit(fullItems, options.weather);
      const userPrefFactor = options.userPrefs?.favor || 1.0; // if any user-specific boost

      // combine with weights
      const score =
        (avgTrend * WEIGHTS.trendMatch)
        + (styleScore * WEIGHTS.styleMatch)
        + (occasionFactor * 100 * WEIGHTS.occasionMatch)
        + (weatherFactor * 100 * WEIGHTS.weatherMatch)
        + (userPrefFactor * 100 * WEIGHTS.userPref);

      // build explanation: list matched trends per item
      const matched = [...top.matchedTrends, ...bottom.matchedTrends].slice(0,5);
      combos.push({
        items: fullItems.map(i => ({ id: i.id, category: i.category, color: i.color, imageUrl: i.imageUrl, trendScore: i.trendScore, name: i.name })),
        score: Math.round(score),
        avgTrend,
        styleScore: Math.round(styleScore),
        occasion: options.occasion || null,
        weather: options.weather || null,
        matchedTrends: matched,
        reason: buildReasonString(fullItems, matched, occasionFactor, weatherFactor)
      });
    }
  }

  // dresses as single-item outfits
  for (const dress of dressCandidates) {
    const fullItems = [dress];
    const avgTrend = dress.trendScore;
    const styleScore = 70; // dresses often self-contained
    const occasionFactor = checkOccasionFit(fullItems, options.occasion);
    const weatherFactor = checkWeatherFit(fullItems, options.weather);
    const score =
      (avgTrend * WEIGHTS.trendMatch)
      + (styleScore * WEIGHTS.styleMatch)
      + (occasionFactor * 100 * WEIGHTS.occasionMatch)
      + (weatherFactor * 100 * WEIGHTS.weatherMatch);

    combos.push({
      items: fullItems.map(i => ({ id: i.id, category: i.category, color: i.color, imageUrl: i.imageUrl, trendScore: i.trendScore, name: i.name })),
      score: Math.round(score),
      avgTrend,
      styleScore: Math.round(styleScore),
      occasion: options.occasion || null,
      weather: options.weather || null,
      matchedTrends: dress.matchedTrends,
      reason: buildReasonString(fullItems, dress.matchedTrends, occasionFactor, weatherFactor)
    });
  }

  // sort combos by score desc and return top N with normalized fields
  combos.sort((a,b) => b.score - a.score);
  return combos.slice(0, MAX_OUTFITS_RETURN).map((c, idx) => ({ rank: idx + 1, ...c }));
}

// human-friendly reason string builder
function buildReasonString(items, matchedTrends, occasionFactor, weatherFactor) {
  const itemSummary = items.map(i => `${i.color || ''} ${i.category}`).join(', ');
  const trendText = matchedTrends.length ? `Matches trends: ${matchedTrends.map(t => t.trend).join('; ')}.` : '';
  const occ = occasionFactor > 0.9 ? 'Good for the chosen occasion.' : (occasionFactor > 0.6 ? 'Okay for the occasion.' : 'May not fit the occasion.');
  const weather = weatherFactor > 0.9 ? 'Weather-appropriate.' : 'Check weather suitability.';
  return `${itemSummary}. ${trendText} ${occ} ${weather}`;
}

// public API
async function getTrendAwareRecommendations(userId, wardrobe, options = { occasion: null, weather: { condition: 'any' }, userPrefs: null }) {
  // normalize wardrobe items (handles extractedAttributes from API)
  const normalizedWardrobe = wardrobe.map(normalizeWardrobeItem).filter(i => i.category);

  if (normalizedWardrobe.length === 0) {
    return {
      userId,
      generatedAt: new Date().toISOString(),
      trendInsights: { summary: 'No wardrobe items with category. Add items to get recommendations.', details: [], fetchedAt: null, sourceCount: 0, rateInfo: null },
      outfits: []
    };
  }

  // fetch trends (cached by trendService)
  const cacheKey = `rec:${userId}:${options.occasion || 'any'}:${options.weather?.condition || 'any'}`;
  // if we cached the final outfits recently, reuse
  const cached = cache.get(cacheKey);
  if (cached) {
    debug('Returning cached recommendations for', cacheKey);
    return cached;
  }

  const trendsPayload = await trendService.fetchTrends({ category: 'all', season: null, limit: 20, force: false });
  const trends = trendsPayload.trends || [];

  // score each wardrobe item against trends
  const scoredItems = scoreWardrobeAgainstTrends(normalizedWardrobe, trends);

  // generate and rank outfits
  const outfits = generateOutfitCombinations(scoredItems, options);

  // compose trendInsights for the result (top trend sources)
  const trendInsights = {
    summary: `Recommendations informed by ${trends.length} live trends.`,
    details: trends.slice(0,5).map(t => ({ title: t.title, url: t.url, relevance: t.relevance })),
    fetchedAt: trendsPayload.timestamp,
    sourceCount: trendsPayload?.sources?.length || 0,
    rateInfo: trendsPayload?.meta?.rateInfo || null
  };

  const result = { userId, generatedAt: new Date().toISOString(), trendInsights, outfits };

  cache.set(cacheKey, result, 60 * 10); // cache recommendations for 10 minutes
  return result;
}

module.exports = { getTrendAwareRecommendations };
