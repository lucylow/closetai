const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');
const router = express.Router();

router.use(authenticate);
router.post('/wear', analyticsController.recordWear);
router.get('/history', analyticsController.getHistory);
router.get('/stats', analyticsController.getAnalytics);

module.exports = router;
