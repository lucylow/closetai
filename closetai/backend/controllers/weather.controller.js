const weatherService = require('../services/weather.service');

const getWeather = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    const weather = await weatherService.getCurrentWeather(
      lat ? parseFloat(lat) : 37.77,
      lon ? parseFloat(lon) : -122.42
    );
    res.json(weather);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWeather };
