const axios = require('axios');
const env = require('../config/env');

class WeatherService {
  async getCurrentWeather(lat, lon) {
    if (!env.openWeatherMap?.apiKey) {
      return { temp: 20, condition: 'clear', humidity: 50, windSpeed: 5 };
    }
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: env.openWeatherMap.apiKey, units: 'metric' },
    });
    const data = response.data;
    return {
      temp: data.main.temp,
      condition: data.weather[0].main.toLowerCase(),
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
    };
  }

  weatherToTags(weather) {
    const tags = [];
    if (weather.temp > 25) tags.push('hot');
    else if (weather.temp < 10) tags.push('cold');
    else tags.push('mild');
    if (weather.condition.includes('rain')) tags.push('rainy');
    if (weather.condition.includes('snow')) tags.push('snowy');
    return tags;
  }
}

module.exports = new WeatherService();
