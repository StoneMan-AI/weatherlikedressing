/**
 * 推荐路由 - 穿衣建议
 */

const express = require('express');
const router = express.Router();
const RuleEngine = require('../services/ruleEngine');
const WeatherService = require('../services/weatherService');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('./users');

const weatherService = new WeatherService();
let ruleEngine = null;

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

    // 获取天气数据
    const weatherData = await weatherService.getCompleteWeatherData(
      parseFloat(latitude),
      parseFloat(longitude),
      timezone
    );

    // 确定使用哪个时间点的天气数据
    let weatherInput;
    if (target_time) {
      weatherInput = weatherService.getWeatherAtTime(weatherData, target_time);
    } else {
      weatherInput = weatherData.current;
    }

    // 获取用户资料（如果已登录且未提供user_profile）
    let finalUserProfile = user_profile || {};
    const userId = req.user?.id;
    if (userId && !user_profile) {
      try {
        const userResult = await pool.query(
          'SELECT profile_json FROM users WHERE id = $1',
          [userId]
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
    const recommendation = ruleEngine.generateRecommendation(inputs);

    // 保存推荐历史（如果提供了user_id）
    if (userId) {
      // 查找location_id
      const locationResult = await pool.query(
        'SELECT id FROM locations WHERE user_id = $1 AND latitude BETWEEN $2 - 0.001 AND $2 + 0.001 AND longitude BETWEEN $3 - 0.001 AND $3 + 0.001 LIMIT 1',
        [userId, parseFloat(latitude), parseFloat(longitude)]
      );

      const locationId = locationResult.rows[0]?.id || null;

      await pool.query(
        `INSERT INTO recommendations (user_id, location_id, timestamp, input_snapshot, comfort_score, recommendation_json)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          locationId,
          new Date(weatherInput.timestamp),
          JSON.stringify(inputs),
          recommendation.comfort_score,
          JSON.stringify(recommendation)
        ]
      );
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
    res.status(500).json({ error: error.message });
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
