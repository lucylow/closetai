/**
 * Outfit Recommendation Engine
 * Integrates: rule-based matching, ML from feedback, weather/event awareness, You.com trends
 */
const { WardrobeItem, Outfit, Rating } = require('../models');
const weatherService = require('./weather.service');
const youcomService = require('./youcom.service');
const fashionResearchService = require('./fashionResearch.service');
const trendAnalyzer = require('./trendAnalyzer');
const banditService = require('./bandit.service');
const ColorHarmony = require('../rules/colorHarmony');
const { scoreOutfit: occasionScore } = require('../rules/occasionRules');
const { scoreOutfit: weatherScore } = require('../rules/weatherRules');
const { getUserProfile } = require('../user/UserProfile');
const path = require('path');
const { spawn } = require('child_process');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cache ephemeral outfit -> items for feedback (outfitId from getDailyOutfits)
const outfitCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

function cacheOutfit(outfitId, data) {
  outfitCache.set(outfitId, { ...data, cachedAt: Date.now() });
  if (outfitCache.size > 500) {
    const oldest = [...outfitCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    if (oldest) outfitCache.delete(oldest[0]);
  }
}

function getCachedOutfit(outfitId) {
  const entry = outfitCache.get(outfitId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    outfitCache.delete(outfitId);
    return null;
  }
  return entry;
}

class RecommendationService {
  async _collaborativeFilteringScores(userId, candidateOutfits) {
    const scriptPath = path.join(__dirname, '../ml/cf_predict.py');
    return new Promise((resolve) => {
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      const python = spawn(pyCmd, [scriptPath, userId, JSON.stringify(candidateOutfits)], {
        cwd: path.dirname(scriptPath),
      });
      let result = '';
      python.stdout.on('data', (data) => { result += data.toString(); });
      python.stderr.on('data', (data) => { console.warn('CF script:', data.toString()); });
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const scores = JSON.parse(result);
            resolve(Array.isArray(scores) ? scores : candidateOutfits.map(() => 0.5));
          } catch {
            resolve(candidateOutfits.map(() => 0.5));
          }
        } else {
          resolve(candidateOutfits.map(() => 0.5));
        }
      });
      python.on('error', () => resolve(candidateOutfits.map(() => 0.5)));
    });
  }

  async generateDailyOutfits(userId, lat = 37.77, lon = -122.42, occasion = 'casual', limit = 5) {
    // 1. Weather & tags
    const weather = await weatherService.getCurrentWeather(lat, lon);
    const weatherTags = weatherService.weatherToTags(weather);

    // 2. You.com trends (via fashion research for richer extraction)
    let trends = { trendingColors: [], trendingCategories: [], trendingStyles: [], keywords: [] };
    try {
      const research = await fashionResearchService.researchUserFashion(userId, occasion);
      trends = research.trends || trends;
    } catch {
      const trendsData = await youcomService.searchFashionTrends(
        `latest ${occasion} fashion trends ${new Date().getFullYear()}`
      );
      const extracted = youcomService.extractTrends(trendsData);
      trends = {
        trendingColors: extracted.trendingColors || [],
        trendingCategories: extracted.keywords || [],
        trendingStyles: [],
        keywords: extracted.keywords || [],
      };
    }

    // 3. Wardrobe & user profile
    const wardrobe = await WardrobeItem.findAll({ where: { userId } });
    const profile = getUserProfile(userId);

    // 4. Generate candidates
    const candidates = this._generateCandidates(wardrobe, occasion, weatherTags);

    // 5. Score each candidate with rule-based + ML + trends
    const scored = [];
    for (const outfit of candidates) {
      const items = outfit.items;

      // Rule-based: occasion
      const occScore = occasionScore(items, occasion);
      if (occScore === 0) continue;

      // Rule-based: weather
      const wthScore = weatherScore(items, weatherTags);
      if (wthScore === 0) continue;

      // Rule-based: color harmony
      if (!ColorHarmony.checkHarmony(items)) continue;

      // User preference (ML from feedback)
      const userScore =
        items.reduce((sum, item) => sum + profile.scoreItemNormalized(item), 0) / items.length;

      // Trend boost (You.com)
      const trendBoost = this._calculateTrendBoost(items, trends);

      // Optional: CF scores
      let cfScore = 0.5;
      try {
        const cfScores = await this._collaborativeFilteringScores(userId, [outfit]);
        cfScore = cfScores[0] ?? 0.5;
      } catch {
        // keep 0.5
      }

      // Combined score (weights: user 40%, trend 30%, rules 20%, CF 10%)
      const totalScore =
        userScore * 0.4 +
        trendBoost * 0.3 +
        (occScore * 0.5 + wthScore * 0.5) * 0.2 +
        cfScore * 0.1;

      const outfitId = `outfit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      cacheOutfit(outfitId, { items, occasion, weatherTags });

      scored.push({
        id: outfitId,
        items,
        occasion,
        weatherTags,
        totalScore,
        trendScore: trendBoost,
        userScore,
        trend: trends.trendingColors?.[0] || trends.keywords?.[0] || 'Classic',
        description: outfit.desc,
      });
    }

    scored.sort((a, b) => b.totalScore - a.totalScore);

    // Bandit exploration: 10% chance to replace last with exploration pick
    let result = scored.slice(0, limit);
    if (scored.length > limit && Math.random() < 0.1) {
      const explorationPick = banditService.selectOutfit(scored.slice(limit));
      if (explorationPick) {
        result = [...result.slice(0, -1), explorationPick];
      }
    }

    return result;
  }

  _generateCandidates(wardrobe, occasion, weatherTags) {
    const getAttr = (item, key) => item.extractedAttributes?.[key];
    const tops = wardrobe.filter((i) => getAttr(i, 'category') === 'top');
    const bottoms = wardrobe.filter((i) => getAttr(i, 'category') === 'bottom');
    const dresses = wardrobe.filter((i) => getAttr(i, 'category') === 'dress');
    const outerwear = wardrobe.filter((i) => getAttr(i, 'category') === 'outerwear');
    const shoes = wardrobe.filter((i) => getAttr(i, 'category') === 'shoes');
    const accessories = wardrobe.filter((i) => getAttr(i, 'category') === 'accessory');
    const candidates = [];

    dresses.forEach((d) => {
      const extras = [];
      if (shoes.length) extras.push(shoes[0]);
      if (accessories.length && Math.random() > 0.5) extras.push(accessories[0]);
      const items = [d, ...extras];
      const colors = items.map((i) => getAttr(i, 'color') || 'styled').join(' & ');
      candidates.push({
        items,
        desc: `A ${occasion} dress look with ${colors}.`,
      });
    });

    tops.forEach((t) => {
      bottoms.forEach((b) => {
        const items = [t, b];
        if (outerwear.length && (weatherTags.includes('cold') || weatherTags.includes('mild'))) {
          items.push(outerwear[0]);
        }
        if (shoes.length) items.push(shoes[0]);
        const colors = [t, b].map((i) => getAttr(i, 'color') || 'styled').join(' & ');
        candidates.push({
          items,
          desc: `A ${occasion} look with ${colors}.`,
        });
      });
    });

    if (candidates.length === 0 && wardrobe.length > 0) {
      candidates.push({
        items: wardrobe.slice(0, Math.min(3, wardrobe.length)),
        desc: `A ${occasion} outfit from your wardrobe.`,
      });
    }
    return candidates;
  }

  _calculateTrendBoost(items, trends) {
    let boost = 0.3;
    const colors = trends.trendingColors || [];
    const categories = trends.trendingCategories || [];
    const styles = trends.trendingStyles || [];
    const keywords = trends.keywords || [];

    items.forEach((item) => {
      const attrs = item.extractedAttributes || {};
      const c = (attrs.color || '').toLowerCase();
      const cat = (attrs.category || '').toLowerCase();
      const style = (attrs.style || '').toLowerCase();
      const tags = (item.userTags || []).join(' ').toLowerCase();

      if (colors.includes(c)) boost += 0.15;
      if (categories.some((k) => cat.includes(k) || k.includes(cat))) boost += 0.15;
      if (styles.includes(style)) boost += 0.1;
      if (keywords.some((k) => tags.includes(k))) boost += 0.1;
    });
    return Math.min(1, boost);
  }

  async recordRating(userId, outfitId, rating, reason = null) {
    const banditReward = rating >= 4 ? 1 : rating <= 2 ? 0 : 0.5;
    banditService.update(outfitId, banditReward);

    // Update UserProfile from cached outfit (ML from feedback)
    const cached = getCachedOutfit(outfitId);
    if (cached?.items?.length) {
      const profile = getUserProfile(userId);
      cached.items.forEach((item) => profile.update(item, rating));
    }

    // Persist rating only for saved outfits (valid UUID)
    if (UUID_REGEX.test(outfitId)) {
      try {
        await Rating.upsert(
          { userId, outfitId, rating, feedback: reason },
          { returning: true }
        );
      } catch {
        // Ignore FK errors for ephemeral outfits
      }
    }

    return { success: true, outfitId, rating };
  }

  /**
   * Update user preferences from item-level interaction.
   * @param {string} userId
   * @param {string} itemId - Wardrobe item ID
   * @param {string} interactionType - 'like' | 'dislike' | 'wear'
   */
  async updateUserPreferences(userId, itemId, interactionType) {
    const item = await WardrobeItem.findOne({ where: { id: itemId, userId } });
    if (!item) return;
    const profile = getUserProfile(userId);
    profile.update(item, interactionType);
  }
}

module.exports = new RecommendationService();
