const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');
const imageProcessingController = require('../controllers/imageProcessing.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.post('/process', upload.single('image'), imageProcessingController.startProcessing);
router.get('/stream/:jobId', imageProcessingController.streamProgress);

module.exports = router;
