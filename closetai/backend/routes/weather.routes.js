const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getWeather } = require('../controllers/weather.controller');
const router = express.Router();

router.use(authenticate);
router.get('/', getWeather);

module.exports = router;
