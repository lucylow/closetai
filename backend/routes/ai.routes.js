const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { explainOutfit, chatWithAI } = require('../controllers/ai.controller');

const router = express.Router();

router.use(authenticate);

router.post('/explain-outfit', explainOutfit);
router.post('/chat', chatWithAI);

module.exports = router;
