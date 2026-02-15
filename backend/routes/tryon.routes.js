const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  virtualTryOn,
  virtualTryOnMulti,
  saveMeasurements,
  estimateMeasurements,
  shareTryOn,
} = require('../controllers/tryon.controller');

const router = express.Router();

router.post('/', virtualTryOn);
router.post('/vton-multi', virtualTryOnMulti);
router.post('/measure', estimateMeasurements);
router.post('/share', shareTryOn);
router.post('/measurements', authenticate, saveMeasurements);

module.exports = router;
