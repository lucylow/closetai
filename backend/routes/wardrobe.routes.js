const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  addItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  bulkDelete,
  bulkUpdateTags,
  recordWear,
  getStats,
  findSimilar,
} = require('../controllers/wardrobe.controller');
const router = express.Router();

router.use(authenticate);

router.post('/', upload.single('image'), addItem);
router.get('/', listItems);
router.get('/stats', getStats);
router.delete('/bulk', bulkDelete);
router.patch('/bulk/tags', bulkUpdateTags);
router.get('/:id/similar', findSimilar);
router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/wear', recordWear);

module.exports = router;
