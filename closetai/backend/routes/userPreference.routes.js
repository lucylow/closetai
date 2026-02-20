const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const prefController = require('../controllers/userPreference.controller');

const router = express.Router();

router.use(authenticate);
router.get('/', prefController.getPreferences);
router.patch('/', prefController.updatePreferences);
router.post('/complete-tour', prefController.completeTour);

module.exports = router;
