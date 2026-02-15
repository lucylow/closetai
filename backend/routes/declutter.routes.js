const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const declutterController = require('../controllers/declutter.controller');
const router = express.Router();

router.use(authenticate);
router.get('/suggestions', declutterController.getSuggestions);
router.delete('/item/:itemId', declutterController.archiveItem);

module.exports = router;
