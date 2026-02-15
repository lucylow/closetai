const recommendationService = require('../services/recommendation.service');
const explanationService = require('../services/explanation.service');
const personalizedRecs = require('../services/personalizedRecs.service');
const { Outfit } = require('../models');

/**
 * Update user preferences from item-level interaction (wear, like, dislike).
 * Used for ML from feedback when user interacts with a single wardrobe item.
 */
const updateUserPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId, interactionType } = req.body;
    await recommendationService.updateUserPreferences(userId, itemId, interactionType);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const getDailyOutfits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lat, lon, occasion } = req.query;
    const outfits = await recommendationService.generateDailyOutfits(
      userId,
      lat ? parseFloat(lat) : 37.77,
      lon ? parseFloat(lon) : -122.42,
      occasion || 'casual',
      5
    );
    res.json(outfits);
  } catch (err) {
    next(err);
  }
};

const rateOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { outfitId, rating, feedback, reason } = req.body;
    const result = await recommendationService.recordRating(userId, outfitId, rating, reason || feedback);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const saveOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, occasion, weatherTags } = req.body;
    const outfit = await Outfit.create({ userId, items, occasion, weatherTags: weatherTags || [] });
    res.status(201).json(outfit);
  } catch (err) {
    next(err);
  }
};

const explainOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { outfitId } = req.params;
    const explanation = await explanationService.generateExplanation(userId, outfitId);
    res.json({ explanation });
  } catch (err) {
    next(err);
  }
};

const getPersonalizedTrendOutfits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 15);
    const outfits = await personalizedRecs.getPersonalizedOutfits(userId, limit);
    res.json(outfits);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyOutfits,
  rateOutfit,
  saveOutfit,
  explainOutfit,
  updateUserPreferences,
  getPersonalizedTrendOutfits,
};
