const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  generateCaption,
  suggestHashtags,
  saveDraft,
  listDrafts,
  deleteDraft,
  generateImage,
  getPostTemplate,
  formatPost,
} = require('../controllers/content.controller');
const router = express.Router();

router.use(authenticate);

router.post('/caption', generateCaption);
router.post('/hashtags', suggestHashtags);
router.post('/generate-image', generateImage);
router.get('/template', getPostTemplate);
router.post('/format', formatPost);
router.post('/drafts', saveDraft);
router.get('/drafts', listDrafts);
router.delete('/drafts/:id', deleteDraft);

module.exports = router;
