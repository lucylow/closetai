# Additional Backend Features for ClosetAI

This document provides detailed backend code for three advanced features that enhance ClosetAI's intelligence and user engagement:

1. **Outfit History & Personal Analytics** – Track user's wearing habits and generate insights.
2. **Automated Decluttering Suggestions** – Identify rarely‑worn items and recommend removal.
3. **Trend Prediction** – Use simple machine learning to forecast which items will become trendy.

All features integrate seamlessly with the existing codebase and sponsor APIs.

---

## Schema Compatibility Notes

ClosetAI's `Outfit` model stores `items` as an **array of UUIDs** (not a join table). All queries and services below are written to match this schema. The `WardrobeItem` model already includes `wearCount`, `lastWornDate`, `purchasePrice`, and `extractedAttributes`.

---

## Feature 1: Outfit History & Personal Analytics

### 1.1 Database Model

Add a new model `OutfitHistory` to record each time a user wears an outfit.

```javascript
// models/OutfitHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutfitHistory = sequelize.define('OutfitHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  outfitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'outfits', key: 'id' },
  },
  wornDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weather: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'worn_date'] },
    { fields: ['outfit_id'] },
  ],
});

module.exports = OutfitHistory;
```

**Associations** in `models/index.js`:

```javascript
const OutfitHistory = require('./OutfitHistory');

Outfit.hasMany(OutfitHistory, { foreignKey: 'outfitId', as: 'history' });
OutfitHistory.belongsTo(Outfit, { foreignKey: 'outfitId' });
User.hasMany(OutfitHistory, { foreignKey: 'userId', as: 'wearHistory' });
OutfitHistory.belongsTo(User, { foreignKey: 'userId' });

// Add OutfitHistory to module.exports
```

### 1.2 Service for Analytics

The `Outfit` model uses `items` (array of item UUIDs), not a join table. The service fetches items via `WardrobeItem.findAll` using `outfit.items`.

```javascript
// services/analytics.service.js
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
      include: [{ model: Outfit, as: 'Outfit', attributes: ['id', 'items', 'occasion'] }],
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
```

### 1.3 Controller & Routes

```javascript
// controllers/analytics.controller.js
const analyticsService = require('../services/analytics.service');

exports.recordWear = async (req, res, next) => {
  try {
    const { outfitId, ...data } = req.body;
    if (!outfitId) return res.status(400).json({ error: 'outfitId is required' });
    const history = await analyticsService.recordWear(req.user.id, outfitId, data);
    res.status(201).json(history);
  } catch (err) {
    if (err.message === 'Outfit not found') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, limit, offset } = req.query;
    const result = await analyticsService.getUserHistory(req.user.id, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getPersonalAnalytics(req.user.id);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};
```

**Routes** (`routes/analytics.routes.js`):

```javascript
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');
const router = express.Router();

router.use(authenticate);
router.post('/wear', analyticsController.recordWear);
router.get('/history', analyticsController.getHistory);
router.get('/stats', analyticsController.getAnalytics);

module.exports = router;
```

---

## Feature 2: Automated Decluttering Suggestions

### 2.1 Service

```javascript
// services/declutter.service.js
const { WardrobeItem } = require('../models');
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
        ['lastWornDate', 'ASC NULLS FIRST'],
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
   */
  async archiveItem(itemId, userId) {
    const item = await WardrobeItem.findOne({ where: { id: itemId, userId } });
    if (!item) throw new Error('Item not found');
    await item.destroy();
    return { success: true };
  }
}

module.exports = new DeclutterService();
```

### 2.2 Controller & Routes

```javascript
// controllers/declutter.controller.js
const declutterService = require('../services/declutter.service');

exports.getSuggestions = async (req, res, next) => {
  try {
    const { thresholdDays, maxWearCount } = req.query;
    const suggestions = await declutterService.getDeclutterSuggestions(req.user.id, {
      thresholdDays: thresholdDays ? parseInt(thresholdDays, 10) : 180,
      maxWearCount: maxWearCount ? parseInt(maxWearCount, 10) : 3,
    });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};

exports.archiveItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    await declutterService.archiveItem(itemId, req.user.id);
    res.json({ message: 'Item archived' });
  } catch (err) {
    if (err.message === 'Item not found') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
};
```

**Routes** (`routes/declutter.routes.js`):

```javascript
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const declutterController = require('../controllers/declutter.controller');
const router = express.Router();

router.use(authenticate);
router.get('/suggestions', declutterController.getSuggestions);
router.delete('/item/:itemId', declutterController.archiveItem);

module.exports = router;
```

---

## Feature 3: Trend Prediction (Simple ML)

### 3.1 Install Dependency

```bash
npm install simple-statistics
```

### 3.2 Service

```javascript
// services/trendPrediction.service.js
const ss = require('simple-statistics');
const { WardrobeItem } = require('../models');

class TrendPredictionService {
  /**
   * Fetch historical trend data for a keyword.
   * In production, integrate with Google Trends API or similar.
   */
  async getHistoricalTrend(keyword) {
    const months = 12;
    const data = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      const base = Math.sin((i / 12) * Math.PI * 2) * 20 + 50;
      const value = Math.max(0, Math.min(100, base + (Math.random() * 10 - 5)));
      data.push({ date: date.toISOString().slice(0, 7), value: Math.round(value) });
    }
    return data;
  }

  /**
   * Predict future trend score for a given keyword using linear regression.
   */
  async predictTrend(keyword, monthsAhead = 3) {
    const historical = await this.getHistoricalTrend(keyword);
    const points = historical.map((d, idx) => [idx, d.value]);

    const regression = ss.linearRegression(points);
    const { m: slope, b: intercept } = regression;
    const lastIndex = points.length - 1;

    const predictions = [];
    for (let i = 1; i <= monthsAhead; i++) {
      const predIndex = lastIndex + i;
      const predValue = intercept + slope * predIndex;
      predictions.push({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        predictedScore: Math.max(0, Math.min(100, Math.round(predValue))),
      });
    }

    return { keyword, historical, predictions };
  }

  /**
   * For each item in user's wardrobe, get a trend prediction.
   */
  async predictItemTrends(userId) {
    const wardrobe = await WardrobeItem.findAll({ where: { userId } });
    const predictions = [];

    for (const item of wardrobe) {
      const attrs = item.extractedAttributes || {};
      const color = attrs.color || '';
      const category = attrs.category || '';
      const style = attrs.style || '';
      const keyword = [color, category, style].filter(Boolean).join(' ').trim();

      if (keyword.length < 3) continue;

      try {
        const trend = await this.predictTrend(keyword, 3);
        predictions.push({ itemId: item.id, keyword, trend });
      } catch {
        // Skip items that fail prediction
      }
    }

    return predictions;
  }
}

module.exports = new TrendPredictionService();
```

### 3.3 Controller & Routes

```javascript
// controllers/trendPrediction.controller.js
const trendPredictionService = require('../services/trendPrediction.service');

exports.predictItemTrends = async (req, res, next) => {
  try {
    const predictions = await trendPredictionService.predictItemTrends(req.user.id);
    res.json(predictions);
  } catch (err) {
    next(err);
  }
};

exports.predictKeyword = async (req, res, next) => {
  try {
    const { keyword, months } = req.query;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const result = await trendPredictionService.predictTrend(
      keyword,
      parseInt(months, 10) || 3
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
```

**Routes** (`routes/trendPrediction.routes.js`):

```javascript
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const trendPredictionController = require('../controllers/trendPrediction.controller');
const router = express.Router();

router.use(authenticate);
router.get('/my-items', trendPredictionController.predictItemTrends);
router.get('/keyword', trendPredictionController.predictKeyword);

module.exports = router;
```

---

## Database Migrations

The project uses `sequelize.sync({ alter: true })` in development. For production, add migrations:

### OutfitHistory table

```javascript
// migrations/YYYYMMDDHHMMSS-add-outfit-history.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('outfit_history', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      outfit_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfits', key: 'id' } },
      worn_date: { type: Sequelize.DATEONLY, allowNull: false },
      occasion: { type: Sequelize.STRING },
      weather: { type: Sequelize.JSONB },
      rating: { type: Sequelize.INTEGER },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('outfit_history', ['user_id', 'worn_date']);
    await queryInterface.addIndex('outfit_history', ['outfit_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('outfit_history');
  },
};
```

### Soft delete for WardrobeItem (optional)

To enable `archiveItem` soft delete, add `deleted_at` and `paranoid: true`:

```javascript
// migrations/YYYYMMDDHHMMSS-add-deleted-at-to-wardrobe.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('wardrobe_items', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('wardrobe_items', 'deleted_at');
  },
};
```

In `models/WardrobeItem.js` add to options:

```javascript
{
  paranoid: true,
  timestamps: true,
  underscored: true,
  // ... rest
}
```

---

## Route Registration

Add to `routes/index.js`:

```javascript
const analyticsRoutes = require('./analytics.routes');
const declutterRoutes = require('./declutter.routes');
const trendPredictionRoutes = require('./trendPrediction.routes');

router.use('/analytics', analyticsRoutes);
router.use('/declutter', declutterRoutes);
router.use('/trend-prediction', trendPredictionRoutes);
```

---

## Testing the New Features

All endpoints require `Authorization: Bearer <token>` and are under `/api`.

### Record Wear

```bash
curl -X POST http://localhost:5000/api/analytics/wear \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"outfitId": "outfit-uuid-here", "occasion": "work", "rating": 5}'
```

### Get Personal Analytics

```bash
curl "http://localhost:5000/api/analytics/stats" \
  -H "Authorization: Bearer <token>"
```

### Get Wear History (with pagination)

```bash
curl "http://localhost:5000/api/analytics/history?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

### Get Declutter Suggestions

```bash
curl "http://localhost:5000/api/declutter/suggestions?thresholdDays=180&maxWearCount=3" \
  -H "Authorization: Bearer <token>"
```

### Archive Item

```bash
curl -X DELETE "http://localhost:5000/api/declutter/item/<itemId>" \
  -H "Authorization: Bearer <token>"
```

### Predict Item Trends

```bash
curl "http://localhost:5000/api/trend-prediction/my-items" \
  -H "Authorization: Bearer <token>"
```

### Predict Keyword Trend

```bash
curl "http://localhost:5000/api/trend-prediction/keyword?keyword=floral%20dress&months=3" \
  -H "Authorization: Bearer <token>"
```

---

## Summary of Improvements

| Area | Original | Improved |
|------|----------|----------|
| **Schema** | Assumed `outfit_items` join table | Uses `outfit.items` array with `unnest()` in SQL |
| **recordWear** | `Outfit.findByPk` + `include: [WardrobeItem]` | Validates ownership, fetches items by `outfit.items` IDs |
| **getUserHistory** | Simple findAll | Pagination, items hydrated per outfit |
| **SQL** | `outfit_items` join | `CROSS JOIN LATERAL unnest(o.items)` for PostgreSQL |
| **Error handling** | `res.status(500).json` | `next(err)` + 404 for not found |
| **Validation** | Minimal | `outfitId` required, `keyword` required |
| **Declutter** | Fixed threshold | Configurable `thresholdDays`, `maxWearCount` |
| **Trend prediction** | Unused youcom import | Removed, robust keyword extraction |

---

## Next Steps

1. **Google Trends API**: Replace synthetic data in `getHistoricalTrend` with real trend data for production.
2. **Caching**: Cache `getPersonalAnalytics` and `predictItemTrends` (e.g., Redis) for performance.
3. **Rate limiting**: Add rate limits to trend prediction endpoints to avoid abuse.
