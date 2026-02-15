const openaiService = require('../services/openai.service');
const hashtagService = require('../services/hashtag.service');
const perfectCorpService = require('../services/perfectCorp.service');
const { applyTemplate, getTemplate } = require('../services/template.service');
const { Draft } = require('../models');

const generateCaption = async (req, res, next) => {
  try {
    const { outfitDescription, tone, occasion } = req.body;
    const caption = await openaiService.generateCaption(
      outfitDescription || '',
      tone || 'casual',
      occasion || 'casual'
    );
    res.json({ caption });
  } catch (err) {
    next(err);
  }
};

const suggestHashtags = async (req, res, next) => {
  try {
    const { outfitAttributes } = req.body;
    const hashtags = await hashtagService.suggestHashtags(outfitAttributes || {});
    res.json({ hashtags });
  } catch (err) {
    next(err);
  }
};

const saveDraft = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { platform, caption, hashtags, imageUrl, scheduledDate } = req.body;
    const draft = await Draft.create({
      userId,
      platform,
      caption,
      hashtags: hashtags || [],
      imageUrl,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    });
    res.status(201).json(draft);
  } catch (err) {
    next(err);
  }
};

const listDrafts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const drafts = await Draft.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });
    res.json(drafts);
  } catch (err) {
    next(err);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await Draft.destroy({ where: { id, userId } });
    res.json({ message: 'Draft deleted' });
  } catch (err) {
    next(err);
  }
};

const generateImage = async (req, res, next) => {
  try {
    const { prompt, style } = req.body;
    const imageBuffer = await perfectCorpService.generateImage(
      prompt || 'casual fashion outfit',
      style || 'photorealistic'
    );
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    if (err.statusCode === 402) {
      return res.status(402).json({
        error: 'Out of API credits. Please try again later.',
        hint: 'Sign up at yce.perfectcorp.com for free credits.',
      });
    }
    next(err);
  }
};

const getPostTemplate = async (req, res, next) => {
  try {
    const { platform } = req.query;
    const template = getTemplate(platform || 'instagram');
    res.json({ template });
  } catch (err) {
    next(err);
  }
};

const formatPost = async (req, res, next) => {
  try {
    const { platform, caption, hashtags } = req.body;
    const post = applyTemplate(platform || 'instagram', caption || '', hashtags || []);
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateCaption,
  suggestHashtags,
  saveDraft,
  listDrafts,
  deleteDraft,
  generateImage,
  getPostTemplate,
  formatPost,
};
