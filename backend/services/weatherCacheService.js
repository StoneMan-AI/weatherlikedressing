/**
 * 天气缓存服务
 * 负责管理天气数据的缓存、更新和查询
 */

const pool = require('../config/database');
const WeatherService = require('./weatherService');

class WeatherCacheService {
  constructor() {
    this.weatherService = new WeatherService();
    this.CACHE_VALIDITY_HOURS = 12; // 缓存有效期12小时（0时和12时更新）
    this.ACTIVE_REGION_DAYS = 10; // 活跃地区定义：10天内有请求
  }

  /**
   * 记录活跃地区
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {string} timezone - 时区
   * @param {string} userId - 用户ID（可选）
   */
  async recordActiveRegion(latitude, longitude, timezone = 'Asia/Shanghai', userId = null) {
    try {
      // 四舍五入到小数点后4位，减少重复数据
      const lat = Math.round(latitude * 10000) / 10000;
      const lon = Math.round(longitude * 10000) / 10000;

      await pool.query(
        `INSERT INTO active_regions (latitude, longitude, timezone, last_requested_at, request_count)
         VALUES ($1, $2, $3, now(), 1)
         ON CONFLICT (latitude, longitude, timezone)
         DO UPDATE SET 
           last_requested_at = now(),
           request_count = active_regions.request_count + 1`,
        [lat, lon, timezone]
      );
      
      // 如果提供了用户ID，记录用户请求（用于统计）
      if (userId) {
        // 这里可以扩展记录用户请求的地区
      }
    } catch (error) {
      console.error('Error recording active region:', error);
    }
  }

  /**
   * 记录天气请求日志
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {string} timezone - 时区
   * @param {string} source - 数据来源（cache/api）
   * @param {string} userId - 用户ID（可选）
   */
  async logWeatherRequest(latitude, longitude, timezone, source = 'cache', userId = null) {
    try {
      await pool.query(
        `INSERT INTO weather_requests (latitude, longitude, timezone, source)
         VALUES ($1, $2, $3, $4)`,
        [latitude, longitude, timezone, source]
      );
      
      // 如果提供了用户ID，可以记录到用户请求表（如果需要）
      if (userId) {
        // 可以扩展记录用户级别的请求统计
      }
    } catch (error) {
      console.error('Error logging weather request:', error);
    }
  }

  /**
   * 获取下一个更新时间（0时或12时）
   */
  getNextUpdateTime() {
    const now = new Date();
    const hour = now.getHours();
    let nextUpdate = new Date(now);
    
    if (hour < 12) {
      // 如果当前时间在0-12点之间，下次更新时间为12时
      nextUpdate.setHours(12, 0, 0, 0);
    } else {
      // 如果当前时间在12-24点之间，下次更新时间为次日0时
      nextUpdate.setDate(nextUpdate.getDate() + 1);
      nextUpdate.setHours(0, 0, 0, 0);
    }
    
    return nextUpdate;
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(cachedData) {
    if (!cachedData || !cachedData.last_updated) {
      return false;
    }

    const lastUpdated = new Date(cachedData.last_updated);
    const now = new Date();
    const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);

    // 如果超过12小时，缓存失效
    return hoursDiff < this.CACHE_VALIDITY_HOURS;
  }

  /**
   * 从数据库获取缓存的天气数据
   */
  async getCachedWeather(latitude, longitude, timezone = 'Asia/Shanghai') {
    try {
      const lat = Math.round(latitude * 10000) / 10000;
      const lon = Math.round(longitude * 10000) / 10000;

      const result = await pool.query(
        `SELECT * FROM weather_data_cache 
         WHERE latitude = $1 AND longitude = $2 AND timezone = $3`,
        [lat, lon, timezone]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const cached = result.rows[0];
      
      // 检查缓存是否有效
      if (this.isCacheValid(cached)) {
        return {
          weather_data: cached.weather_data,
          aqi: cached.aqi,
          aqi_status: cached.aqi_status,
          last_updated: cached.last_updated,
          source: 'cache'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting cached weather:', error);
      return null;
    }
  }

  /**
   * 保存天气数据到缓存
   */
  async saveWeatherCache(latitude, longitude, timezone, weatherData, aqi, aqiStatus) {
    try {
      const lat = Math.round(latitude * 10000) / 10000;
      const lon = Math.round(longitude * 10000) / 10000;
      const nextUpdate = this.getNextUpdateTime();

      await pool.query(
        `INSERT INTO weather_data_cache 
         (latitude, longitude, timezone, weather_data, aqi, aqi_status, last_updated, next_update_time)
         VALUES ($1, $2, $3, $4, $5, $6, now(), $7)
         ON CONFLICT (latitude, longitude, timezone)
         DO UPDATE SET 
           weather_data = $4,
           aqi = $5,
           aqi_status = $6,
           last_updated = now(),
           next_update_time = $7`,
        [lat, lon, timezone, JSON.stringify(weatherData), aqi, aqiStatus, nextUpdate]
      );
    } catch (error) {
      console.error('Error saving weather cache:', error);
      throw error;
    }
  }

  /**
   * 获取天气数据（优先从缓存，否则从API获取）
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {string} timezone - 时区
   * @param {number} forecastDays - 预报天数
   * @param {string} userId - 用户ID（可选）
   */
  async getWeatherData(latitude, longitude, timezone = 'Asia/Shanghai', forecastDays = 15, userId = null) {
    // 记录活跃地区（如果失败不影响主流程）
    try {
      await this.recordActiveRegion(latitude, longitude, timezone, userId);
    } catch (error) {
      console.warn('Failed to record active region (table may not exist):', error.message);
    }

    // 尝试从缓存获取（如果表不存在，返回null）
    let cached = null;
    try {
      cached = await this.getCachedWeather(latitude, longitude, timezone);
    } catch (error) {
      console.warn('Failed to get cached weather (table may not exist):', error.message);
      cached = null;
    }
    
    if (cached) {
      try {
        await this.logWeatherRequest(latitude, longitude, timezone, 'cache', userId);
      } catch (error) {
        // 忽略日志记录错误
      }
      return {
        ...cached.weather_data,
        aqi: cached.aqi,
        aqi_status: cached.aqi_status,
        source: 'cache'
      };
    }

    // 缓存未命中或已过期，从API获取
    try {
      const weatherData = await this.weatherService.getCompleteWeatherData(
        latitude,
        longitude,
        timezone,
        forecastDays
      );

      // 验证数据完整性
      if (!weatherData || !weatherData.current) {
        throw new Error('天气API返回的数据不完整');
      }

      // 验证必需字段
      const requiredFields = ['temperature_c', 'relative_humidity', 'wind_m_s'];
      const missingFields = requiredFields.filter(field => 
        weatherData.current[field] === undefined || weatherData.current[field] === null
      );
      
      if (missingFields.length > 0) {
        throw new Error(`天气数据缺少必需字段: ${missingFields.join(', ')}`);
      }

      // 尝试保存到缓存（如果表不存在，忽略错误）
      try {
        await this.saveWeatherCache(
          latitude,
          longitude,
          timezone,
          weatherData,
          weatherData.aqi,
          weatherData.aqi_status
        );
      } catch (error) {
        console.warn('Failed to save weather cache (table may not exist):', error.message);
        // 继续执行，不抛出错误
      }

      try {
        await this.logWeatherRequest(latitude, longitude, timezone, 'api', userId);
      } catch (error) {
        // 忽略日志记录错误
      }
      
      return {
        ...weatherData,
        source: 'api'
      };
    } catch (error) {
      console.error('Error fetching weather from API:', error);
      // 提供更详细的错误信息
      if (error.response) {
        throw new Error(`天气API请求失败: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('无法连接到天气API服务，请检查网络连接');
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取10天内活跃的地区列表
   */
  async getActiveRegions() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ACTIVE_REGION_DAYS);

      const result = await pool.query(
        `SELECT DISTINCT latitude, longitude, timezone 
         FROM active_regions 
         WHERE last_requested_at >= $1
         ORDER BY last_requested_at DESC`,
        [cutoffDate]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting active regions:', error);
      return [];
    }
  }

  /**
   * 批量更新活跃地区的天气数据
   */
  async updateActiveRegionsWeather() {
    try {
      const activeRegions = await this.getActiveRegions();
      console.log(`Found ${activeRegions.length} active regions to update`);

      let successCount = 0;
      let errorCount = 0;

      for (const region of activeRegions) {
        try {
          const weatherData = await this.weatherService.getCompleteWeatherData(
            region.latitude,
            region.longitude,
            region.timezone,
            15
          );

          await this.saveWeatherCache(
            region.latitude,
            region.longitude,
            region.timezone,
            weatherData,
            weatherData.aqi,
            weatherData.aqi_status
          );

          successCount++;
          console.log(`Updated weather for ${region.latitude}, ${region.longitude}`);
        } catch (error) {
          errorCount++;
          console.error(`Error updating weather for ${region.latitude}, ${region.longitude}:`, error.message);
        }

        // 避免API请求过快，添加延迟
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Weather update completed: ${successCount} success, ${errorCount} errors`);
      return { successCount, errorCount, total: activeRegions.length };
    } catch (error) {
      console.error('Error updating active regions weather:', error);
      throw error;
    }
  }

  /**
   * 清理过期的活跃地区记录（超过10天未请求）
   */
  async cleanupInactiveRegions() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ACTIVE_REGION_DAYS);

      const result = await pool.query(
        `DELETE FROM active_regions 
         WHERE last_requested_at < $1`,
        [cutoffDate]
      );

      console.log(`Cleaned up ${result.rowCount} inactive regions`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up inactive regions:', error);
      return 0;
    }
  }
}

module.exports = WeatherCacheService;

