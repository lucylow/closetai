const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getUserTrendReport, getTrendAwareOutfits } = require('../controllers/fashionResearch.controller');

const router = express.Router();

router.use(authenticate);
router.get('/report', getUserTrendReport);
router.get('/outfits', getTrendAwareOutfits);

module.exports = router;
