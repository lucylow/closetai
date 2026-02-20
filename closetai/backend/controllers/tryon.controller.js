const perfectCorpService = require('../services/perfectCorp.service');
const linodeService = require('../services/linode.service');
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

const uploadVisualize = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
}).fields([
  { name: 'userPhoto', maxCount: 1 },
  { name: 'topImage', maxCount: 1 },
  { name: 'bottomImage', maxCount: 1 },
]);

/**
 * POST /api/tryon
 * Virtual try-on: overlay garment on model photo using Perfect Corp API.
 * Query ?share=true returns shareable URL instead of streaming image.
 */
async function virtualTryOn(req, res, next) {
  upload(req, res, async (err) => {
    if (err) return next(err);
    const modelFile = req.files?.model_image?.[0];
    const garmentFile = req.files?.garment_image?.[0];
    const category = req.body?.category || 'top';
    const fit = req.body?.fit || 'standard';
    const returnShareableUrl = req.query?.share === 'true' || req.body?.share === 'true';

    if (!modelFile || !garmentFile) {
      return res.status(400).json({ error: 'model_image and garment_image required' });
    }

    try {
      const resultBuffer = await perfectCorpService.virtualTryOn(
        modelFile.buffer,
        garmentFile.buffer,
        category,
        fit
      );

      if (returnShareableUrl) {
        const { url, key, expiresAt } = await perfectCorpService.createShareableResult(
          resultBuffer,
          'vton_result'
        );
        return res.json({ url, key, expiresAt });
      }

      res.set('Content-Type', 'image/png');
      res.send(resultBuffer);
    } catch (e) {
      if (e.code === 'PERFECTCREDITS' || e.statusCode === 402) {
        return res.status(402).json({
          error: 'Out of API credits. Please try again later.',
          hint: 'Sign up at yce.perfectcorp.com for free credits.',
        });
      }
      if (e.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Virtual try-on service not configured',
          hint: 'Add YOUCAM_API_KEY to enable',
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
      if (e.statusCode === 402) {
        return res.status(402).json({
          error: 'Out of API credits. Please try again later.',
          hint: 'Sign up at yce.perfectcorp.com for free credits.',
        });
      }
      if (e.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Virtual try-on service not configured',
          hint: 'Add YOUCAM_API_KEY to enable',
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
 * POST /api/tryon/visualize-outfit
 * Wardrobe stylist flow: VTON (top + optional bottom) + optional AI-generated social post image.
 * Combines Virtual Try-On and AI Text-to-Image APIs.
 */
async function visualizeOutfit(req, res, next) {
  uploadVisualize(req, res, async (err) => {
    if (err) return next(err);
    const userPhoto = req.files?.userPhoto?.[0];
    const topImage = req.files?.topImage?.[0];
    const bottomImage = req.files?.bottomImage?.[0];
    const outfitDescription = req.body?.outfitDescription || 'A casual fashion look';
    const generateSocialImage = req.body?.generateSocialImage === 'true' || req.body?.generateSocialImage === true;

    if (!userPhoto || !topImage) {
      return res.status(400).json({
        error: 'userPhoto and topImage required',
        hint: 'Upload your photo and at least the top garment.',
      });
    }

    try {
      // Step 1: Virtual try-on for top
      let vtonBuffer = await perfectCorpService.virtualTryOn(
        userPhoto.buffer,
        topImage.buffer,
        'top'
      );

      // Step 2: If bottom provided, chain VTON
      if (bottomImage) {
        vtonBuffer = await perfectCorpService.virtualTryOn(
          vtonBuffer,
          bottomImage.buffer,
          'bottom'
        );
      }

      // Step 3: Upload VTON result and get URL
      const { url: vtonResultUrl } = await perfectCorpService.createShareableResult(vtonBuffer);

      let aiGeneratedUrl = null;
      if (generateSocialImage) {
        const aiBuffer = await perfectCorpService.generateImage(outfitDescription, 'photorealistic');
        const aiFileName = `outfit_ai_${Date.now()}.png`;
        const { url } = await linodeService.uploadFile(aiBuffer, aiFileName, 'shared', 'generated');
        const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || '';
        aiGeneratedUrl = url.startsWith('http') ? url : (baseUrl ? `${baseUrl.replace(/\/$/, '')}${url}` : url);
      }

      res.json({
        vtonResultUrl,
        aiGeneratedUrl,
        message: 'Outfit visualized successfully',
      });
    } catch (e) {
      if (e.statusCode === 402) {
        return res.status(402).json({
          error: 'Out of API credits. Please try again later.',
          hint: 'Sign up at yce.perfectcorp.com for free credits.',
        });
      }
      if (e.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Perfect Corp API not configured',
          hint: 'Add YOUCAM_API_KEY to enable.',
        });
      }
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

/**
 * POST /api/tryon/generate-image
 * Generate fashion image from text prompt. Returns shareable URL.
 */
async function generateImageTryon(req, res, next) {
  try {
    const { prompt, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }
    const maybeImage = await perfectCorpService.generateImage(
      prompt,
      style || 'photorealistic'
    );
    if (Buffer.isBuffer(maybeImage)) {
      const { url } = await perfectCorpService.createShareableResult(maybeImage, 'ai_gen');
      return res.json({ url });
    }
    if (typeof maybeImage === 'object') {
      if (maybeImage.url) return res.json({ url: maybeImage.url });
      if (maybeImage.generatedImageUrl) return res.json({ url: maybeImage.generatedImageUrl });
    }
    return res.status(500).json({ error: 'Unexpected API response format' });
  } catch (e) {
    if (e.code === 'PERFECTCREDITS' || e.statusCode === 402) {
      return res.status(402).json({
        error: 'Out of API credits. Please try again later.',
        hint: 'Sign up at yce.perfectcorp.com for free credits.',
      });
    }
    next(e);
  }
}

module.exports = {
  virtualTryOn,
  virtualTryOnMulti,
  saveMeasurements,
  estimateMeasurements,
  shareTryOn,
  visualizeOutfit,
  generateImageTryon,
};
