const express = require('express');
const authRoutes = require('./auth.routes');
const wardrobeRoutes = require('./wardrobe.routes');
const recommendationRoutes = require('./recommendation.routes');
const contentRoutes = require('./content.routes');
const weatherRoutes = require('./weather.routes');
const trendsRoutes = require('./trends.routes');
const fashionResearchRoutes = require('./fashionResearch.routes');
const tryonRoutes = require('./tryon.routes');
const aiRoutes = require('./ai.routes');
const imageProcessingRoutes = require('./imageProcessing.routes');
const userPreferenceRoutes = require('./userPreference.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/tryon', tryonRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/content', contentRoutes);
router.use('/weather', weatherRoutes);
router.use('/trends', trendsRoutes);
router.use('/fashion', fashionResearchRoutes);
router.use('/image', imageProcessingRoutes);
router.use('/preferences', userPreferenceRoutes);

module.exports = router;
