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
    const cachedResults = await this.searchInCache(searchTerm);
    
    if (cachedResults.length === 1) {
      // 只有一个匹配结果，直接返回并更新搜索次数
      await this.updateSearchCount(cachedResults[0].id);
      return cachedResults[0];
    } else if (cachedResults.length > 1) {
      // 多个匹配结果，返回列表让用户选择
      return {
        multiple: true,
        results: cachedResults
      };
    }
    
    // 2. 数据库中没有匹配结果，调用OpenStreetMap API
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
      console.error('OpenStreetMap API调用失败:', error);
      throw new Error(`搜索失败: ${error.message}`);
    }
  }

  /**
   * 在缓存中搜索城市（模糊匹配）
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} - 匹配的城市列表
   */
  async searchInCache(searchTerm) {
    try {
      const searchTermLower = searchTerm.toLowerCase();
      
      // 使用ILIKE进行不区分大小写的模糊匹配
      // 支持部分匹配：城市名称包含搜索关键词，或搜索关键词包含城市名称
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
          OR LOWER(city_name) LIKE $2
        ORDER BY 
          CASE 
            WHEN LOWER(city_name) = $3 THEN 1
            WHEN LOWER(city_name) LIKE $4 THEN 2
            WHEN LOWER(display_name) LIKE $1 THEN 3
            ELSE 4
          END,
          search_count DESC,
          last_searched_at DESC
        LIMIT 10`,
        [
          `%${searchTermLower}%`,  // 城市名称或显示名称包含搜索关键词
          `${searchTermLower}%`,   // 城市名称以搜索关键词开头
          searchTermLower,         // 完全匹配（优先级最高）
          `${searchTermLower}%`    // 以搜索关键词开头
        ]
      );
      
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
   * 调用多个地理编码服务搜索城市（支持多个备用服务）
   * @param {string} cityName - 城市名称
   * @returns {Promise<Array>} - 搜索结果列表
   */
  async searchInOpenStreetMap(cityName) {
    // 多个地理编码服务列表（按优先级排序）
    const geocodingServices = [
      {
        name: 'OpenStreetMap Nominatim',
        search: async () => {
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
              timeout: 8000
            }
          );
          return response.data || [];
        },
        parser: (item) => {
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
        }
      },
      {
        name: 'Photon (Komoot)',
        search: async () => {
          // Photon是Komoot提供的开源地理编码服务，无需API密钥
          const response = await axios.get(
            `https://photon.komoot.io/api/`,
            {
              params: {
                q: cityName,
                limit: 10,
                lang: 'zh,en'
              },
              timeout: 8000
            }
          );
          return response.data?.features || [];
        },
        parser: (item) => {
          const properties = item.properties || {};
          const coordinates = item.geometry?.coordinates || [];
          return {
            name: properties.name || cityName,
            display_name: properties.name ? `${properties.name}, ${properties.country || ''}` : cityName,
            latitude: parseFloat(coordinates[1] || properties.lat),
            longitude: parseFloat(coordinates[0] || properties.lon),
            timezone: this.estimateTimezone(parseFloat(coordinates[1] || properties.lat), parseFloat(coordinates[0] || properties.lon)),
            country_code: properties.countrycode?.toUpperCase(),
            country_name: properties.country,
            state: properties.state || properties.region
          };
        }
      },
      {
        name: 'REST Countries + 预置数据',
        search: async () => {
          // 作为最后备选，使用预置的常用城市数据
          return this.searchInPresetCities(cityName);
        },
        parser: (item) => item // 预置数据已经是正确格式
      }
    ];

    // 依次尝试每个服务
    for (const service of geocodingServices) {
      try {
        console.log(`尝试使用 ${service.name} 搜索城市: ${cityName}`);
        const rawResults = await service.search();
        
        if (rawResults && rawResults.length > 0) {
          const parsedResults = rawResults
            .map(item => {
              try {
                return service.parser(item);
              } catch (parseError) {
                console.warn(`${service.name} 解析结果失败:`, parseError);
                return null;
              }
            })
            .filter(item => item && item.latitude && item.longitude);
          
          if (parsedResults.length > 0) {
            console.log(`${service.name} 搜索成功，找到 ${parsedResults.length} 个结果`);
            return parsedResults;
          }
        }
      } catch (error) {
        console.warn(`${service.name} 搜索失败:`, error.message);
        // 继续尝试下一个服务
        continue;
      }
    }
    
    // 所有服务都失败
    throw new Error('所有地理编码服务均无法访问，请检查网络连接或稍后重试');
  }

  /**
   * 在预置的常用城市数据中搜索（最后备选方案）
   * 从数据库中读取预置城市数据（search_count >= 100 表示预置数据）
   * @param {string} cityName - 城市名称
   * @returns {Promise<Array>} - 搜索结果列表
   */
  async searchInPresetCities(cityName) {
    try {
      const searchTermLower = cityName.toLowerCase().trim();
      const searchPattern = `%${cityName}%`;
      
      // 从数据库查询预置城市数据（search_count >= 100 表示预置数据）
      const result = await pool.query(
        `SELECT 
          id, city_name, display_name, latitude, longitude, timezone, 
          country_code, country_name, state, search_count
        FROM city_geocoding_cache
        WHERE search_count >= 100
          AND (
            LOWER(city_name) LIKE LOWER($1)
            OR LOWER(display_name) LIKE LOWER($1)
            OR LOWER(state) LIKE LOWER($1)
            OR LOWER(city_name) = LOWER($2)
            OR LOWER(city_name) = LOWER($2 || '市')
            OR LOWER(city_name) = LOWER($2 || '省')
          )
        ORDER BY 
          CASE 
            WHEN LOWER(city_name) = LOWER($2) THEN 1
            WHEN LOWER(city_name) = LOWER($2 || '市') THEN 2
            WHEN LOWER(city_name) LIKE LOWER($2 || '%') THEN 3
            ELSE 4
          END,
          search_count DESC
        LIMIT 20`,
        [searchPattern, cityName]
      );
      
      if (result.rows.length === 0) {
        return [];
      }
      
      // 转换为统一格式
      return result.rows.map(row => ({
        id: row.id,
        name: row.city_name,
        display_name: row.display_name,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        timezone: row.timezone || 'Asia/Shanghai',
        country_code: row.country_code,
        country_name: row.country_name,
        state: row.state,
        search_count: row.search_count
      }));
    } catch (error) {
      console.error('查询预置城市数据失败:', error);
      // 如果数据库查询失败，返回空数组，让上层继续处理
      return [];
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

