const perfectCorpService = require('../services/perfectCorp.service');
const { User } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/tryon');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
}).fields([
  { name: 'model_image', maxCount: 1 },
  { name: 'garment_image', maxCount: 1 },
]);

const uploadMulti = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
}).fields([
  { name: 'model_image', maxCount: 1 },
  { name: 'garment_images', maxCount: 5 },
]);

const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

/**
 * POST /api/tryon
 * Virtual try-on: overlay garment on model photo using Perfect Corp API
 */
async function virtualTryOn(req, res, next) {
  upload(req, res, async (err) => {
    if (err) return next(err);
    const modelFile = req.files?.model_image?.[0];
    const garmentFile = req.files?.garment_image?.[0];
    const category = req.body?.category || 'top';

    if (!modelFile || !garmentFile) {
      return res.status(400).json({ error: 'model_image and garment_image required' });
    }

    try {
      const resultBuffer = await perfectCorpService.virtualTryOn(
        modelFile.buffer,
        garmentFile.buffer,
        category
      );
      res.set('Content-Type', 'image/jpeg');
      res.send(resultBuffer);
    } catch (e) {
      if (e.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Virtual try-on service not configured',
          hint: 'Add PERFECT_CORP_API_KEY to enable',
        });
      }
      next(e);
    }
  });
}

async function virtualTryOnMulti(req, res, next) {
  uploadMulti(req, res, async (err) => {
    if (err) return next(err);
    const modelFile = req.files?.model_image?.[0];
    const garmentFiles = req.files?.garment_images || [];
    const categories = req.body?.categories
      ? (typeof req.body.categories === 'string'
          ? JSON.parse(req.body.categories)
          : req.body.categories)
      : [];

    if (!modelFile || !garmentFiles.length) {
      return res.status(400).json({
        error: 'model_image and at least one garment_images required',
      });
    }

    try {
      const garmentBuffers = garmentFiles.map((f) => f.buffer);
      const resultBuffer = await perfectCorpService.virtualTryOnMulti(
        modelFile.buffer,
        garmentBuffers,
        categories.length ? categories : garmentBuffers.map(() => 'top')
      );
      res.set('Content-Type', 'image/png');
      res.send(resultBuffer);
    } catch (e) {
      if (e.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Virtual try-on service not configured',
          hint: 'Add PERFECT_CORP_API_KEY to enable',
        });
      }
      next(e);
    }
  });
}

async function saveMeasurements(req, res, next) {
  try {
    const userId = req.user.id;
    const measurements = req.body;
    await User.update({ measurements }, { where: { id: userId } });
    res.json({ message: 'Measurements saved' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tryon/measure
 * Body measurement approximation from user photo
 */
async function estimateMeasurements(req, res, next) {
  const uploadMeasure = uploadSingle.single('image');
  uploadMeasure(req, res, async (err) => {
    if (err) return next(err);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'image required' });
    }
    try {
      const measurements = await perfectCorpService.estimateMeasurements(file.buffer);
      res.json(measurements);
    } catch (e) {
      next(e);
    }
  });
}

/**
 * POST /api/tryon/share
 * Upload try-on result and return shareable URL
 */
async function shareTryOn(req, res, next) {
  const uploadShare = uploadSingle.single('image');
  uploadShare(req, res, async (err) => {
    if (err) return next(err);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'image required' });
    }
    try {
      const { url, key, expiresAt } = await perfectCorpService.createShareableResult(file.buffer);
      res.json({ url, key, expiresAt });
    } catch (e) {
      next(e);
    }
  });
}

module.exports = { virtualTryOn, virtualTryOnMulti, saveMeasurements, estimateMeasurements, shareTryOn };
