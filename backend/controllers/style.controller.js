const youcomService = require('../services/youcom.service');
const { WardrobeItem } = require('../models');

exports.getStylingAdvice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { occasion, vibe } = req.query;

    const item = await WardrobeItem.findOne({
      where: { id: itemId, userId },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const adviceData = await youcomService.getStylingAdvice(item, {
      occasion: occasion || undefined,
      vibe: vibe || undefined,
    });

    res.json({
      item: {
        id: item.id,
        imageUrl: item.imageUrl,
        attributes: item.extractedAttributes,
      },
      ...adviceData,
    });
  } catch (err) {
    next(err);
  }
};
