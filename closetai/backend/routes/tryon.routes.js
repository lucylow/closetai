const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  virtualTryOn,
  virtualTryOnMulti,
  saveMeasurements,
  estimateMeasurements,
  shareTryOn,
  visualizeOutfit,
  generateImageTryon,
} = require('../controllers/tryon.controller');

const router = express.Router();

router.post('/', virtualTryOn);
router.post('/vton', virtualTryOn); // alias for compatibility
router.post('/vton-multi', virtualTryOnMulti);
router.post('/visualize-outfit', visualizeOutfit);
router.post('/generate-image', express.json(), generateImageTryon);
router.post('/measure', estimateMeasurements);
router.post('/share', shareTryOn);
router.post('/measurements', authenticate, saveMeasurements);

module.exports = router;
