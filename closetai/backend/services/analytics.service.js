const { OutfitHistory, WardrobeItem, Outfit, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  /**
   * Record that a user wore a specific outfit.
   * Validates outfit ownership and increments wear count for each item.
   */
  async recordWear(userId, outfitId, data = {}) {
    const outfit = await Outfit.findOne({ where: { id: outfitId, userId } });
    if (!outfit) throw new Error('Outfit not found');

    const wornDate = data.wornDate ? new Date(data.wornDate) : new Date();
    const history = await OutfitHistory.create({
      userId,
      outfitId,
      wornDate: wornDate.toISOString().slice(0, 10),
      occasion: data.occasion,
      weather: data.weather,
      rating: data.rating,
      notes: data.notes,
    });

    const itemIds = outfit.items || [];
    if (itemIds.length > 0) {
      const items = await WardrobeItem.findAll({
        where: { id: { [Op.in]: itemIds }, userId },
      });
      for (const item of items) {
        item.wearCount = (item.wearCount || 0) + 1;
        item.lastWornDate = wornDate.toISOString().slice(0, 10);
        await item.save();
      }
    }

    return history;
  }

  /**
   * Get wear history for a user, with optional date range and pagination.
   */
  async getUserHistory(userId, { startDate, endDate, limit = 50, offset = 0 } = {}) {
    const where = { userId };
    if (startDate || endDate) {
      where.wornDate = {};
      if (startDate) where.wornDate[Op.gte] = startDate;
      if (endDate) where.wornDate[Op.lte] = endDate;
    }

    const { rows, count } = await OutfitHistory.findAndCountAll({
      where,
      include: [{ model: Outfit, attributes: ['id', 'items', 'occasion'] }],
      order: [['wornDate', 'DESC']],
      limit: Math.min(limit, 100),
      offset,
    });

    const historyWithItems = await Promise.all(
      rows.map(async (h) => {
        const itemIds = h.Outfit?.items || [];
        const items = itemIds.length
          ? await WardrobeItem.findAll({
              where: { id: { [Op.in]: itemIds }, userId },
              attributes: ['id', 'imageUrl', 'extractedAttributes', 'wearCount'],
            })
          : [];
        return {
          ...h.toJSON(),
          items,
        };
      })
    );

    return { history: historyWithItems, total: count };
  }

  /**
   * Generate personal analytics for a user.
   * Uses raw SQL with unnest() for outfit.items array (PostgreSQL).
   */
  async getPersonalAnalytics(userId) {
    const totalWears = await OutfitHistory.count({ where: { userId } });

    const mostWornItems = await WardrobeItem.findAll({
      where: { userId },
      order: [['wearCount', 'DESC']],
      limit: 5,
      attributes: ['id', 'imageUrl', 'extractedAttributes', 'wearCount'],
    });

    const [favoriteColors, favoriteCategories] = await Promise.all([
      sequelize.query(
        `SELECT wi.extracted_attributes->>'color' as color, COUNT(oh.id)::int as wear_count
         FROM outfit_history oh
         JOIN outfits o ON oh.outfit_id = o.id
         CROSS JOIN LATERAL unnest(COALESCE(o.items, ARRAY[]::uuid[])) AS item_id
         JOIN wardrobe_items wi ON wi.id = item_id AND wi.user_id = :userId
         WHERE oh.user_id = :userId
         GROUP BY wi.extracted_attributes->>'color'
         HAVING wi.extracted_attributes->>'color' IS NOT NULL
         ORDER BY wear_count DESC
         LIMIT 5`,
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT wi.extracted_attributes->>'category' as category, COUNT(oh.id)::int as wear_count
         FROM outfit_history oh
         JOIN outfits o ON oh.outfit_id = o.id
         CROSS JOIN LATERAL unnest(COALESCE(o.items, ARRAY[]::uuid[])) AS item_id
         JOIN wardrobe_items wi ON wi.id = item_id AND wi.user_id = :userId
         WHERE oh.user_id = :userId
         GROUP BY wi.extracted_attributes->>'category'
         HAVING wi.extracted_attributes->>'category' IS NOT NULL
         ORDER BY wear_count DESC`,
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const wearsLast30Days = await OutfitHistory.count({
      where: { userId, wornDate: { [Op.gte]: thirtyDaysAgo } },
    });

    return {
      totalWears,
      mostWornItems,
      favoriteColors,
      favoriteCategories,
      wearsLast30Days,
    };
  }
}

module.exports = new AnalyticsService();
