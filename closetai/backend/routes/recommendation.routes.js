const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const {
  getDailyOutfits,
  rateOutfit,
  saveOutfit,
  explainOutfit,
  updateUserPreferences,
  getPersonalizedTrendOutfits,
} = require('../controllers/recommendation.controller');
const recommendationEngine = require('../services/recommendationEngine');
const skinRecommendationService = require('../services/skinRecommendation.service');
const router = express.Router();

// POST /recommend — trend-aware outfit recommendations (raw engine format)
// Works with or without auth (optionalAuthenticate) for demo/API consumers
router.post('/recommend', optionalAuthenticate, async (req, res) => {
  try {
    const { userId = 'anon', wardrobe, occasion, weather, userPrefs } = req.body;
    if (!wardrobe || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return res.status(400).json({ error: 'wardrobe array required' });
    }
    const uid = req.user?.id || userId;
    const result = await recommendationEngine.getTrendAwareRecommendations(uid, wardrobe, {
      occasion,
      weather,
      userPrefs,
    });
    res.json(result);
  } catch (err) {
    console.error('recommend error', err);
    res.status(500).json({ error: 'Recommendation failed', detail: err.message });
  }
});

router.use(authenticate);

router.get('/daily', getDailyOutfits);
router.get('/personalized-trend', getPersonalizedTrendOutfits);
router.post('/rate', rateOutfit);
router.post('/preferences', updateUserPreferences);
router.post('/save', saveOutfit);
router.get('/explain/:outfitId', explainOutfit);

// GET /recommendations/skin-based - Get personalized recommendations based on skin analysis
// Requires authentication - uses user's latest skin analysis
router.get('/skin-based', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, occasion, season } = req.query;
    
    const result = await skinRecommendationService.getPersonalizedRecommendations(userId, {
      limit: parseInt(limit) || 10,
      occasion,
      season
    });
    
    res.json(result);
  } catch (err) {
    console.error('skin-based recommendation error', err);
    res.status(500).json({ error: 'Skin-based recommendation failed', detail: err.message });
  }
});

// GET /recommendations/shopping-suggestions - Get shopping suggestions based on skin color
router.get('/shopping-suggestions', async (req, res) => {
  try {
    const { skinColor } = req.query;
    
    if (!skinColor) {
      return res.status(400).json({ error: 'skinColor query parameter required' });
    }
    
    const result = skinRecommendationService.getShoppingSuggestions(skinColor);
    res.json(result);
  } catch (err) {
    console.error('shopping suggestions error', err);
    res.status(500).json({ error: 'Failed to get suggestions', detail: err.message });
  }
});

module.exports = router;
