const { WardrobeItem } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class DeclutterService {
  /**
   * Find items that haven't been worn in a long time.
   */
  async getUnwornItems(userId, thresholdDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    return WardrobeItem.findAll({
      where: {
        userId,
        [Op.or]: [
          { lastWornDate: { [Op.lt]: cutoffStr } },
          { lastWornDate: null, wearCount: 0 },
          { lastWornDate: null, wearCount: { [Op.lte]: 2 } },
        ],
      },
      order: [
        sequelize.literal('last_worn_date ASC NULLS FIRST'),
        ['wearCount', 'ASC'],
      ],
    });
  }

  /**
   * Suggest items to donate/sell based on wear count and last worn.
   */
  async getDeclutterSuggestions(userId, options = {}) {
    const { thresholdDays = 180, maxWearCount = 3 } = options;
    const items = await this.getUnwornItems(userId, thresholdDays);

    const suggestions = items.filter((item) => (item.wearCount || 0) < maxWearCount);

    return suggestions.map((item) => {
      const json = item.toJSON();
      return {
        ...json,
        potentialValue: json.purchasePrice
          ? Math.round(parseFloat(json.purchasePrice) * 0.3 * 100) / 100
          : null,
        daysSinceWorn: json.lastWornDate
          ? Math.floor((Date.now() - new Date(json.lastWornDate)) / (24 * 60 * 60 * 1000))
          : null,
      };
    });
  }

  /**
   * Archive item (soft delete). Requires WardrobeItem to have paranoid: true and deletedAt column.
   * Falls back to hard delete if paranoid is not enabled.
   */
  async archiveItem(itemId, userId) {
    const item = await WardrobeItem.findOne({ where: { id: itemId, userId } });
    if (!item) throw new Error('Item not found');
    await item.destroy();
    return { success: true };
  }
}

module.exports = new DeclutterService();
