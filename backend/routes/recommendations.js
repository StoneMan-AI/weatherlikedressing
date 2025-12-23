/**
 * 推荐路由 - 穿衣建议
 */

const express = require('express');
const router = express.Router();
const RuleEngine = require('../services/ruleEngine');
const WeatherService = require('../services/weatherService');
const TravelRecommendationService = require('../services/travelRecommendationService');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('./users');

const weatherService = new WeatherService();
let ruleEngine = null;
let travelRecommendationService = null;

// 加载规则配置
function loadRulesConfig() {
  try {
    const rulesPath = path.join(__dirname, '../../dressing_rules_v1.json');
    const rulesData = fs.readFileSync(rulesPath, 'utf8');
    return JSON.parse(rulesData);
  } catch (error) {
    console.error('Error loading rules config:', error);
    throw error;
  }
}

// 初始化规则引擎
try {
  const rulesConfig = loadRulesConfig();
  ruleEngine = new RuleEngine(rulesConfig);
  travelRecommendationService = new TravelRecommendationService(ruleEngine);
} catch (error) {
  console.error('Failed to initialize rule engine:', error);
}

/**
 * POST /api/recommendations/calculate
 * 计算穿衣推荐
 */
router.post('/calculate', async (req, res) => {
  try {
    if (!ruleEngine) {
      console.error('Rule engine not initialized');
      return res.status(500).json({ error: 'Rule engine not initialized' });
    }

    const {
      latitude,
      longitude,
      timezone = 'Asia/Shanghai',
      is_outdoor = true,
      activity_level = 'low',
      user_profile = null,
      target_time = null // 可选，指定时间
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // 验证坐标范围
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // 获取天气数据（使用缓存服务）
    const WeatherCacheService = require('../services/weatherCacheService');
    const weatherCacheService = new WeatherCacheService();
    
    let weatherData;
    try {
      weatherData = await weatherCacheService.getWeatherData(
        parseFloat(latitude),
        parseFloat(longitude),
        timezone,
        15
      );
    } catch (weatherError) {
      console.error('Failed to fetch weather data:', weatherError);
      return res.status(503).json({ 
        error: '无法获取天气数据，请稍后重试',
        retryable: true 
      });
    }

    // 验证天气数据
    if (!weatherData || !weatherData.current) {
      console.error('Invalid weather data received:', weatherData);
      return res.status(503).json({ 
        error: '天气数据无效，请稍后重试',
        retryable: true 
      });
    }

    // 确定使用哪个时间点的天气数据
    let weatherInput;
    if (target_time) {
      weatherInput = weatherService.getWeatherAtTime(weatherData, target_time);
    } else {
      weatherInput = weatherData.current;
    }
    
    // 确保weatherInput包含所有必需字段
    if (!weatherInput) {
      weatherInput = weatherData.current;
    }

    // 验证天气输入数据的完整性
    if (!weatherInput.temperature_c && weatherInput.temperature_c !== 0) {
      console.error('Missing temperature data:', weatherInput);
      return res.status(503).json({ 
        error: '天气数据不完整，请稍后重试',
        retryable: true 
      });
    }

    // 获取用户资料（如果已登录且未提供user_profile）
    let finalUserProfile = user_profile || {};
    const loggedInUserId = req.user?.id;
    if (loggedInUserId && !user_profile) {
      try {
        const userResult = await pool.query(
          'SELECT profile_json FROM users WHERE id = $1',
          [loggedInUserId]
        );
        if (userResult.rows.length > 0 && userResult.rows[0].profile_json) {
          finalUserProfile = userResult.rows[0].profile_json;
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
      }
    }

    // 准备规则引擎输入
    const inputs = {
      timestamp: weatherInput.timestamp,
      temperature_c: weatherInput.temperature_c,
      relative_humidity: weatherInput.relative_humidity,
      wind_m_s: weatherInput.wind_m_s,
      gust_m_s: weatherInput.gust_m_s || 0,
      uv_index: weatherInput.uv_index || 0,
      precip_prob: weatherInput.precip_prob || 0,
      aqi: weatherData.aqi || 50,
      is_outdoor: is_outdoor === true || is_outdoor === 'true',
      activity_level: activity_level || 'low',
      user_profile: finalUserProfile
    };

    // 生成推荐
    let recommendation;
    try {
      recommendation = ruleEngine.generateRecommendation(inputs);
      
      // 验证推荐结果
      if (!recommendation || !recommendation.comfort_score) {
        throw new Error('Invalid recommendation result');
      }
    } catch (recommendationError) {
      console.error('Failed to generate recommendation:', recommendationError);
      return res.status(500).json({ 
        error: '生成推荐失败，请稍后重试',
        retryable: true 
      });
    }

    // 保存推荐历史（如果提供了user_id，使用req.userId支持匿名用户）
    const finalUserId = req.user?.id || req.userId;
    if (finalUserId) {
      try {
        // 查找location_id（仅对登录用户）
        let locationId = null;
        if (req.user?.id) {
          const locationResult = await pool.query(
            'SELECT id FROM locations WHERE user_id = $1 AND latitude BETWEEN $2 - 0.001 AND $2 + 0.001 AND longitude BETWEEN $3 - 0.001 AND $3 + 0.001 LIMIT 1',
            [req.user.id, parseFloat(latitude), parseFloat(longitude)]
          );
          locationId = locationResult.rows[0]?.id || null;
        }

        // 记录推荐请求（包括匿名用户）
        // 注意：这里可以记录到日志或分析系统，但不一定需要保存到数据库
        // 如果数据库表支持匿名用户，可以保存；否则只记录日志
        console.log(`Recommendation generated for user: ${finalUserId}, location: ${latitude},${longitude}`);
      } catch (dbError) {
        // 数据库错误不影响推荐结果返回
        console.warn('Failed to save recommendation history:', dbError);
      }
    }

    res.json({
      success: true,
      data: {
        recommendation,
        weather: {
          current: weatherInput,
          aqi: weatherData.aqi,
          aqi_status: weatherData.aqi_status
        }
      }
    });
  } catch (error) {
    console.error('Error in /recommendations/calculate:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body));
    console.error('User ID:', req.userId || req.user?.id || 'anonymous');
    
    // 判断错误类型，决定是否可重试
    const isRetryable = !error.status || error.status >= 500 || error.code === 'ECONNREFUSED';
    
    res.status(error.status || 500).json({ 
      error: error.message || '获取推荐失败，请稍后重试',
      retryable: isRetryable,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/recommendations/travel
 * 生成旅行穿衣建议
 */
router.post('/travel', async (req, res) => {
  try {
    if (!travelRecommendationService) {
      console.error('Travel recommendation service not initialized');
      return res.status(500).json({ error: 'Travel recommendation service not initialized' });
    }

    const {
      latitude,
      longitude,
      timezone = 'Asia/Shanghai',
      start_date,
      end_date,
      user_profile = null
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // 验证日期范围
    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2); // 至少2天后
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 15); // 最多15天后

    if (start < minDate) {
      return res.status(400).json({ error: '出发日期至少需要2天后' });
    }

    if (end > maxDate) {
      return res.status(400).json({ error: '返回日期不能超过15天后' });
    }

    if (end < start) {
      return res.status(400).json({ error: '返回日期不能早于出发日期' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 2) {
      return res.status(400).json({ error: '旅行时间至少需要2天' });
    }

    // 获取用户资料（如果已登录且未提供user_profile）
    let finalUserProfile = user_profile || {};
    const loggedInUserId = req.user?.id;
    if (loggedInUserId && !user_profile) {
      try {
        const userResult = await pool.query(
          'SELECT profile_json FROM users WHERE id = $1',
          [loggedInUserId]
        );
        if (userResult.rows.length > 0 && userResult.rows[0].profile_json) {
          finalUserProfile = userResult.rows[0].profile_json;
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
      }
    }

    // 获取天气数据（使用缓存服务）
    const WeatherCacheService = require('../services/weatherCacheService');
    const weatherCacheService = new WeatherCacheService();
    
    let weatherData;
    try {
      weatherData = await weatherCacheService.getWeatherData(
        parseFloat(latitude),
        parseFloat(longitude),
        timezone,
        15
      );
    } catch (weatherError) {
      console.error('Failed to fetch weather data:', weatherError);
      return res.status(503).json({ 
        error: '无法获取天气数据，请稍后重试',
        retryable: true 
      });
    }

    if (!weatherData || !weatherData.daily || weatherData.daily.length === 0) {
      return res.status(503).json({ 
        error: '天气数据不完整，请稍后重试',
        retryable: true 
      });
    }

    // 筛选日期范围内的天气数据
    const startDateStr = start_date.split('T')[0]; // 只取日期部分
    const endDateStr = end_date.split('T')[0];
    
    const filteredDailyData = weatherData.daily.filter(day => {
      const dayDateStr = (day.date || day.time || '').split('T')[0];
      return dayDateStr >= startDateStr && dayDateStr <= endDateStr;
    });

    if (filteredDailyData.length === 0) {
      return res.status(400).json({ 
        error: '所选日期范围内没有天气数据，请选择其他日期' 
      });
    }

    // 生成旅行推荐
    const travelRecommendation = travelRecommendationService.generateTravelRecommendation(
      {
        start_date,
        end_date
      },
      filteredDailyData,
      finalUserProfile
    );

    res.json({
      success: true,
      data: travelRecommendation
    });
  } catch (error) {
    console.error('Error in /recommendations/travel:', error);
    console.error('Error stack:', error.stack);
    
    const isRetryable = !error.status || error.status >= 500 || error.code === 'ECONNREFUSED';
    
    res.status(error.status || 500).json({ 
      error: error.message || '生成旅行建议失败，请稍后重试',
      retryable: isRetryable,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/recommendations/history
 * 获取推荐历史
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT r.*, l.name as location_name, l.latitude, l.longitude
       FROM recommendations r
       LEFT JOIN locations l ON r.location_id = l.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error in /recommendations/history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
