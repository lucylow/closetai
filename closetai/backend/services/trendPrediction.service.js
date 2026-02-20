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
