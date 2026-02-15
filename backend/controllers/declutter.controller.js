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
