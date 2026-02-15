const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const styleController = require('../controllers/style.controller');

const router = express.Router();

router.use(authenticate);
router.get('/advice/:itemId', styleController.getStylingAdvice);

module.exports = router;
