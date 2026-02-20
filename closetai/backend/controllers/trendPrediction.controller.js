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
