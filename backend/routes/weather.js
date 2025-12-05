/**
 * 天气路由
 */

const express = require('express');
const router = express.Router();
const WeatherService = require('../services/weatherService');
const pool = require('../config/database');

const weatherService = new WeatherService();

/**
 * GET /api/weather/current
 * 获取当前天气数据
 */
router.get('/current', async (req, res) => {
  try {
    const { latitude, longitude, timezone = 'Asia/Shanghai' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await weatherService.getCompleteWeatherData(
      parseFloat(latitude),
      parseFloat(longitude),
      timezone
    );

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error in /weather/current:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weather/forecast
 * 获取天气预报
 */
router.get('/forecast', async (req, res) => {
  try {
    const { latitude, longitude, timezone = 'Asia/Shanghai', hours = 48 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await weatherService.getCompleteWeatherData(
      parseFloat(latitude),
      parseFloat(longitude),
      timezone
    );

    // 限制返回的小时数
    const forecast = weatherData.forecast.slice(0, parseInt(hours));

    res.json({
      success: true,
      data: {
        current: weatherData.current,
        forecast,
        aqi: weatherData.aqi,
        aqi_status: weatherData.aqi_status
      }
    });
  } catch (error) {
    console.error('Error in /weather/forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
