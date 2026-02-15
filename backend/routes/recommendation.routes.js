const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getDailyOutfits,
  rateOutfit,
  saveOutfit,
  explainOutfit,
  updateUserPreferences,
  getPersonalizedTrendOutfits,
} = require('../controllers/recommendation.controller');
const router = express.Router();

router.use(authenticate);

router.get('/daily', getDailyOutfits);
router.get('/personalized-trend', getPersonalizedTrendOutfits);
router.post('/rate', rateOutfit);
router.post('/preferences', updateUserPreferences);
router.post('/save', saveOutfit);
router.get('/explain/:outfitId', explainOutfit);

module.exports = router;
