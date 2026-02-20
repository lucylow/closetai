const { WardrobeItem } = require('../models');
const linodeService = require('../services/linode.service');
const imageProcessingService = require('../services/imageProcessing.service');
const { findSimilarItems } = require('../utils/embeddingUtils');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const addItem = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    const { processedBuffer, attributes, embedding } = await imageProcessingService.processUpload(
      file.buffer,
      file.originalname
    );

    const { url, key } = await linodeService.uploadFile(
      processedBuffer,
      file.originalname,
      userId,
      'processed'
    );

    const tags = req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [];
    const item = await WardrobeItem.create(
      {
        userId,
        imageUrl: url,
        imageKey: key,
        extractedAttributes: attributes,
        userTags: tags,
        purchaseDate: req.body.purchaseDate || null,
        purchasePrice: req.body.purchasePrice || null,
        embedding,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(item);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const listItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, color, tags, sortBy, sortOrder, limit, offset } = req.query;
    const where = { userId };
    if (tags) {
      where.userTags = { [Op.overlap]: tags.split(',').map((t) => t.trim()) };
    }
    let items = await WardrobeItem.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    if (category) {
      items = items.filter((i) => i.extractedAttributes?.category === category);
    }
    if (color) {
      items = items.filter(
        (i) =>
          (i.extractedAttributes?.color || '').toLowerCase() === color.toLowerCase()
      );
    }
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'wearCount') {
      items.sort((a, b) =>
        orderDir === 'ASC'
          ? (a.wearCount || 0) - (b.wearCount || 0)
          : (b.wearCount || 0) - (a.wearCount || 0)
      );
    } else if (sortBy === 'purchaseDate') {
      items.sort((a, b) => {
        const da = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
        const db = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
        return orderDir === 'ASC' ? da - db : db - da;
      });
    } else if (sortBy === 'createdAt') {
      items.sort((a, b) => {
        const da = new Date(a.createdAt);
        const db = new Date(b.createdAt);
        return orderDir === 'ASC' ? da - db : db - da;
      });
    }
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    if (offsetNum !== undefined || limitNum !== undefined) {
      items = items.slice(offsetNum || 0, (offsetNum || 0) + (limitNum || items.length));
    }
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const item = await WardrobeItem.findOne({ where: { id: req.params.id, userId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const item = await WardrobeItem.findOne({ where: { id: req.params.id, userId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const allowedUpdates = ['userTags', 'extractedAttributes', 'purchaseDate', 'purchasePrice'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const item = await WardrobeItem.findOne({ where: { id: req.params.id, userId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await linodeService.deleteFile(item.imageKey);
    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};

const bulkDelete = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array required' });
    }
    const items = await WardrobeItem.findAll({
      where: { id: { [Op.in]: itemIds }, userId },
      transaction: t,
    });
    for (const item of items) {
      await linodeService.deleteFile(item.imageKey);
    }
    await WardrobeItem.destroy({
      where: { id: { [Op.in]: itemIds }, userId },
      transaction: t,
    });
    await t.commit();
    res.json({ message: `${items.length} items deleted` });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const bulkUpdateTags = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemIds, tagsToAdd, tagsToRemove } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array required' });
    }
    const items = await WardrobeItem.findAll({ where: { id: { [Op.in]: itemIds }, userId } });
    for (const item of items) {
      let newTags = item.userTags || [];
      if (tagsToAdd && tagsToAdd.length) {
        newTags = [...new Set([...newTags, ...tagsToAdd])];
      }
      if (tagsToRemove && tagsToRemove.length) {
        newTags = newTags.filter((t) => !tagsToRemove.includes(t));
      }
      item.userTags = newTags;
      await item.save();
    }
    res.json({ message: 'Tags updated' });
  } catch (err) {
    next(err);
  }
};

const recordWear = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const item = await WardrobeItem.findOne({ where: { id: req.params.id, userId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.wearCount = (item.wearCount || 0) + 1;
    item.lastWornDate = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const items = await WardrobeItem.findAll({ where: { userId } });
    const totalItems = items.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const wornLast30Days = items.filter(
      (i) => i.lastWornDate && new Date(i.lastWornDate) >= thirtyDaysAgo
    ).length;
    const wearCounts = items.map((i) => i.wearCount || 0).filter((c) => c > 0);
    const avgWearCount =
      wearCounts.length > 0
        ? wearCounts.reduce((a, b) => a + b, 0) / wearCounts.length
        : 0;
    const categoryBreakdown = items.reduce((acc, i) => {
      const cat = i.extractedAttributes?.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    res.json({
      totalItems,
      wornLast30Days,
      avgWearCount: Math.round(avgWearCount * 100) / 100,
      categoryBreakdown,
    });
  } catch (err) {
    next(err);
  }
};

const findSimilar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);

    const targetItem = await WardrobeItem.findOne({ where: { id, userId } });
    if (!targetItem) return res.status(404).json({ error: 'Item not found' });

    const targetEmbedding = targetItem.embedding;
    if (!targetEmbedding || !Array.isArray(targetEmbedding)) {
      return res.json([]);
    }

    const items = await WardrobeItem.findAll({
      where: { userId, id: { [Op.ne]: id } },
    });

    const similar = findSimilarItems(items, targetEmbedding, limit);
    res.json(similar);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
