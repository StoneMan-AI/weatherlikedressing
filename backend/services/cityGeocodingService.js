/**
 * 城市地理编码服务
 * 提供城市搜索功能，支持缓存和模糊匹配
 */

const axios = require('axios');
const pool = require('../config/database');

class CityGeocodingService {
  /**
   * 搜索城市（支持缓存和模糊匹配）
   * @param {string} cityName - 城市名称
   * @returns {Promise<Object|Array>} - 如果只有一个结果返回对象，多个结果返回数组
   */
  async searchCity(cityName) {
    if (!cityName || !cityName.trim()) {
      throw new Error('城市名称不能为空');
    }

    const searchTerm = cityName.trim();
    
    // 1. 首先在数据库中搜索（模糊匹配）
    console.log(`开始搜索城市: "${searchTerm}"`);
    const cachedResults = await this.searchInCache(searchTerm);
    console.log(`缓存查询结果: ${cachedResults.length} 条`);
    
    if (cachedResults.length === 1) {
      // 只有一个匹配结果，直接返回并更新搜索次数
      console.log(`缓存命中，直接返回: ${cachedResults[0].name}`);
      await this.updateSearchCount(cachedResults[0].id);
      return cachedResults[0];
    } else if (cachedResults.length > 1) {
      // 多个匹配结果，返回列表让用户选择
      console.log(`缓存中找到多个结果: ${cachedResults.map(r => r.name).join(', ')}`);
      return {
        multiple: true,
        results: cachedResults
      };
    }
    
    // 2. 数据库中没有匹配结果，调用OpenStreetMap API
    console.log(`缓存未命中，调用外部API搜索: "${searchTerm}"`);
    try {
      const apiResults = await this.searchInOpenStreetMap(searchTerm);
      
      if (apiResults.length === 0) {
        throw new Error('未找到该城市');
      }
      
      // 保存到缓存
      const savedResults = [];
      for (const result of apiResults) {
        const saved = await this.saveToCache(result);
        savedResults.push(saved);
      }
      
      if (savedResults.length === 1) {
        return savedResults[0];
      } else {
        return {
          multiple: true,
          results: savedResults
        };
      }
    } catch (error) {
      console.error('外部API调用失败:', error);
      // 如果错误信息已经包含详细说明，直接抛出
      if (error.message.includes('无法搜索城市')) {
        throw error;
      }
      // 否则提供通用错误信息
      throw new Error(`搜索城市"${searchTerm}"失败: ${error.message}。请检查网络连接或稍后重试。`);
    }
  }

  /**
   * 在缓存中搜索城市（模糊匹配）
   * 包括预置数据和用户搜索过的缓存数据
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} - 匹配的城市列表
   */
  async searchInCache(searchTerm) {
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const searchPattern = `%${searchTermLower}%`;
      const citySuffix = searchTermLower + '市';
      const provinceSuffix = searchTermLower + '省';
      const startsWithPattern = `${searchTermLower}%`;
      
      // 使用ILIKE进行不区分大小写的模糊匹配
      // 查询所有缓存数据（包括预置数据和用户搜索过的数据）
      // 支持匹配：城市名称、显示名称、州/省名称
      const result = await pool.query(
        `SELECT 
          id,
          city_name,
          display_name,
          latitude,
          longitude,
          timezone,
          country_code,
          country_name,
          state,
          search_count
        FROM city_geocoding_cache
        WHERE 
          LOWER(city_name) LIKE $1 
          OR LOWER(display_name) LIKE $1
          OR LOWER(state) LIKE $1
          OR LOWER(city_name) = $2
          OR LOWER(city_name) = $3
          OR LOWER(city_name) = $4
        ORDER BY 
          CASE 
            WHEN LOWER(city_name) = $2 THEN 1
            WHEN LOWER(city_name) = $3 THEN 2
            WHEN LOWER(city_name) LIKE $5 THEN 3
            WHEN LOWER(display_name) LIKE $1 THEN 4
            ELSE 5
          END,
          search_count DESC,
          last_searched_at DESC
        LIMIT 20`,
        [
          searchPattern,      // $1: 模糊匹配模式
          searchTermLower,    // $2: 精确匹配
          citySuffix,         // $3: 城市名称 + "市"
          provinceSuffix,     // $4: 城市名称 + "省"
          startsWithPattern   // $5: 以搜索关键词开头
        ]
      );
      
      console.log(`缓存搜索 "${searchTerm}": 找到 ${result.rows.length} 条结果`);
      if (result.rows.length > 0) {
        console.log(`匹配结果: ${result.rows.map(r => r.city_name).join(', ')}`);
      }
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.city_name,
        display_name: row.display_name,
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone || 'Asia/Shanghai',
        country_code: row.country_code,
        country_name: row.country_name,
        state: row.state,
        search_count: row.search_count
      }));
    } catch (error) {
      console.error('缓存搜索失败:', error);
      return [];
    }
  }

  /**
   * 调用OpenStreetMap Nominatim API搜索城市
   * @param {string} cityName - 城市名称
   * @returns {Promise<Array>} - 搜索结果列表
   */
  async searchInOpenStreetMap(cityName) {
    try {
      console.log(`使用 OpenStreetMap Nominatim 搜索城市: ${cityName}`);
      
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: cityName,
            format: 'json',
            limit: 10,
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'WeatherApp/1.0'
          },
          timeout: 10000
        }
      );
      
      if (!response.data || response.data.length === 0) {
        console.log(`OpenStreetMap Nominatim 未找到结果: ${cityName}`);
        return [];
      }
      
      // 解析OpenStreetMap返回的数据
      const parsedResults = response.data
        .map(item => {
          try {
            const address = item.address || {};
            const cityName = address.city || 
                            address.town || 
                            address.village ||
                            address.county ||
                            item.display_name?.split(',')[0] ||
                            cityName;
            
            return {
              name: cityName,
              display_name: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              timezone: this.estimateTimezone(parseFloat(item.lat), parseFloat(item.lon)),
              country_code: address.country_code?.toUpperCase(),
              country_name: address.country,
              state: address.state || address.region
            };
          } catch (parseError) {
            console.warn('解析OpenStreetMap结果失败:', parseError);
            return null;
          }
        })
        .filter(item => item && item.latitude && item.longitude);
      
      if (parsedResults.length > 0) {
        console.log(`OpenStreetMap Nominatim 搜索成功，找到 ${parsedResults.length} 个结果`);
        return parsedResults;
      }
      
      return [];
    } catch (error) {
      const errorMsg = error.response?.status 
        ? `HTTP ${error.response.status}: ${error.message}`
        : error.message;
      console.error(`OpenStreetMap Nominatim API调用失败:`, errorMsg);
      throw new Error(`无法搜索城市"${cityName}"。OpenStreetMap Nominatim API调用失败: ${errorMsg}。请检查网络连接或稍后重试。`);
    }
  }


  /**
   * 保存搜索结果到缓存
   * @param {Object} cityData - 城市数据
   * @returns {Promise<Object>} - 保存后的城市数据
   */
  async saveToCache(cityData) {
    try {
      const result = await pool.query(
        `INSERT INTO city_geocoding_cache 
         (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, NOW(), NOW(), NOW())
         ON CONFLICT (city_name, latitude, longitude) 
         DO UPDATE SET 
           search_count = city_geocoding_cache.search_count + 1,
           last_searched_at = NOW(),
           updated_at = NOW()
         RETURNING id, city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count`,
        [
          cityData.name,
          cityData.display_name,
          cityData.latitude,
          cityData.longitude,
          cityData.timezone,
          cityData.country_code,
          cityData.country_name,
          cityData.state
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error('保存到缓存失败');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.city_name,
        display_name: row.display_name,
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone,
        country_code: row.country_code,
        country_name: row.country_name,
        state: row.state,
        search_count: row.search_count
      };
    } catch (error) {
      console.error('保存到缓存失败:', error);
      // 即使保存失败，也返回原始数据
      return cityData;
    }
  }

  /**
   * 更新搜索次数
   * @param {number} id - 城市记录ID
   */
  async updateSearchCount(id) {
    try {
      await pool.query(
        `UPDATE city_geocoding_cache 
         SET search_count = search_count + 1,
             last_searched_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('更新搜索次数失败:', error);
    }
  }

  /**
   * 估算时区（基于经纬度）
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @returns {string} - 时区字符串
   */
  estimateTimezone(latitude, longitude) {
    // 简单的时区估算：中国地区使用Asia/Shanghai
    if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
      return 'Asia/Shanghai';
    }
    // 可以根据需要添加更多时区判断
    return 'Asia/Shanghai'; // 默认时区
  }
}

module.exports = CityGeocodingService;

