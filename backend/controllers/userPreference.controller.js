const { UserPreference } = require('../models');

const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let prefs = await UserPreference.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await UserPreference.create({ userId });
    }
    res.json(prefs);
  } catch (err) {
    next(err);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tourCompleted, lastTourStep, settings } = req.body;
    const [prefs] = await UserPreference.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    if (tourCompleted !== undefined) prefs.tourCompleted = tourCompleted;
    if (lastTourStep !== undefined) prefs.lastTourStep = lastTourStep;
    if (settings !== undefined) {
      prefs.settings = { ...(prefs.settings || {}), ...settings };
    }
    await prefs.save();
    res.json(prefs);
  } catch (err) {
    next(err);
  }
};

const completeTour = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [prefs] = await UserPreference.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    prefs.tourCompleted = true;
    prefs.lastTourStep = 0;
    await prefs.save();
    res.json(prefs);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPreferences, updatePreferences, completeTour };
