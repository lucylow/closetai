const express = require('express');
const { optionalAuthenticate } = require('../middleware/auth.middleware');
const { getTrends, getTrendsWithCitations } = require('../controllers/trends.controller');

const router = express.Router();

router.get('/', optionalAuthenticate, getTrends);
router.get('/with-citations', optionalAuthenticate, getTrendsWithCitations);

module.exports = router;
