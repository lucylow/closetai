const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const trendPredictionController = require('../controllers/trendPrediction.controller');
const router = express.Router();

router.use(authenticate);
router.get('/my-items', trendPredictionController.predictItemTrends);
router.get('/keyword', trendPredictionController.predictKeyword);

module.exports = router;
