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
