const express = require('express');
const { optionalAuthenticate } = require('../middleware/auth.middleware');
const {
  getTrends,
  getTrendsWithCitations,
  getFashionTrends,
  getTrendAwareOutfits,
  searchTrends,
} = require('../controllers/trends.controller');

const router = express.Router();

router.get('/', optionalAuthenticate, getTrends);
router.get('/with-citations', optionalAuthenticate, getTrendsWithCitations);
router.get('/fashion', getFashionTrends);
router.get('/search', searchTrends);
router.post('/outfits/trend-aware', optionalAuthenticate, getTrendAwareOutfits);

module.exports = router;
