/**
 * 天气路由
 */

const express = require('express');
const router = express.Router();
const WeatherCacheService = require('../services/weatherCacheService');

const weatherCacheService = new WeatherCacheService();

/**
 * GET /api/weather/current
 * 获取当前天气数据（使用缓存）
 */
router.get('/current', async (req, res) => {
  try {
    const { latitude, longitude, timezone = 'Asia/Shanghai' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await weatherCacheService.getWeatherData(
      parseFloat(latitude),
      parseFloat(longitude),
      timezone,
      15 // 获取15天数据
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
 * 获取天气预报（使用缓存）
 */
router.get('/forecast', async (req, res) => {
  try {
    const { latitude, longitude, timezone = 'Asia/Shanghai', days = 15 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await weatherCacheService.getWeatherData(
      parseFloat(latitude),
      parseFloat(longitude),
      timezone,
      parseInt(days) || 15
    );

    res.json({
      success: true,
      data: {
        current: weatherData.current,
        hourly: weatherData.hourly || [], // 24小时详细数据
        daily: weatherData.daily || [], // 15天每日数据
        aqi: weatherData.aqi,
        aqi_status: weatherData.aqi_status,
        source: weatherData.source
      }
    });
  } catch (error) {
    console.error('Error in /weather/forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weather/update
 * 手动触发天气数据更新（管理员功能）
 */
router.post('/update', async (req, res) => {
  try {
    const SchedulerService = require('../services/schedulerService');
    const schedulerInstance = new SchedulerService();
    const result = await schedulerInstance.triggerUpdate();
    
    res.json({
      success: true,
      message: 'Weather update triggered',
      result
    });
  } catch (error) {
    console.error('Error triggering weather update:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
