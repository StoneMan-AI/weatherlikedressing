/**
 * 天气服务 - 聚合Open-Meteo和AQI API
 */

const axios = require('axios');

class WeatherService {
  constructor() {
    this.openMeteoBaseUrl = 'https://api.open-meteo.com/v1/forecast';
    // AQI API需要API密钥，这里使用Open-Meteo的空气质量（如果可用）或AirVisual
    this.aqiApiKey = process.env.AIRVISUAL_API_KEY;
  }

  /**
   * 获取天气数据（主API：Open-Meteo）
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {string} timezone - 时区
   * @param {number} forecastDays - 预报天数（最大16天，默认15天）
   */
  async fetchWeatherData(latitude, longitude, timezone = 'Asia/Shanghai', forecastDays = 15) {
    try {
      // Open-Meteo免费版最多支持16天预报
      const maxDays = Math.min(forecastDays, 16);
      
      const params = {
        latitude,
        longitude,
        timezone,
        hourly: [
          'temperature_2m',
          'relativehumidity_2m',
          'wind_speed_10m',
          'wind_gusts_10m',
          'uv_index',
          'precipitation_probability',
          'precipitation'
        ].join(','),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'precipitation_probability_max',
          'wind_speed_10m_max',
          'wind_gusts_10m_max',
          'uv_index_max'
        ].join(','),
        forecast_days: maxDays
      };

      const response = await axios.get(this.openMeteoBaseUrl, { params });
      const data = response.data;

      if (!data.hourly || !data.daily) {
        throw new Error('Invalid weather data response');
      }

      // 处理小时数据
      const now = new Date();
      const hourly = data.hourly;
      const timeArray = hourly.time || [];
      
      // 找到当前时间对应的索引
      let currentIndex = 0;
      for (let i = 0; i < timeArray.length; i++) {
        const time = new Date(timeArray[i]);
        if (time >= now) {
          currentIndex = i;
          break;
        }
      }

      // 提取当前天气数据
      const currentWeather = {
        timestamp: timeArray[currentIndex],
        temperature_c: hourly.temperature_2m[currentIndex],
        relative_humidity: hourly.relativehumidity_2m[currentIndex],
        wind_m_s: hourly.wind_speed_10m[currentIndex],
        gust_m_s: hourly.wind_gusts_10m[currentIndex] || 0,
        uv_index: hourly.uv_index[currentIndex] || 0,
        precip_prob: hourly.precipitation_probability[currentIndex] || 0,
        precipitation: hourly.precipitation[currentIndex] || 0
      };

      // 提取未来24小时数据（用于当天详情展示）
      const hourlyForecast = [];
      const hoursToShow = Math.min(24, timeArray.length - currentIndex);
      for (let i = currentIndex; i < currentIndex + hoursToShow; i++) {
        hourlyForecast.push({
          timestamp: timeArray[i],
          temperature_c: hourly.temperature_2m[i],
          relative_humidity: hourly.relativehumidity_2m[i],
          wind_m_s: hourly.wind_speed_10m[i],
          gust_m_s: hourly.wind_gusts_10m[i] || 0,
          uv_index: hourly.uv_index[i] || 0,
          precip_prob: hourly.precipitation_probability[i] || 0,
          precipitation: hourly.precipitation[i] || 0
        });
      }

      // 处理每日数据（用于15天预报）
      const daily = data.daily;
      const dailyForecast = [];
      const dailyTimeArray = daily.time || [];
      
      for (let i = 0; i < dailyTimeArray.length; i++) {
        dailyForecast.push({
          date: dailyTimeArray[i],
          temperature_max: daily.temperature_2m_max[i],
          temperature_min: daily.temperature_2m_min[i],
          precipitation_sum: daily.precipitation_sum[i] || 0,
          precipitation_probability_max: daily.precipitation_probability_max[i] || 0,
          wind_speed_max: daily.wind_speed_10m_max[i] || 0,
          wind_gust_max: daily.wind_gusts_10m_max[i] || 0,
          uv_index_max: daily.uv_index_max[i] || 0
        });
      }

      return {
        current: currentWeather,
        hourly: hourlyForecast, // 24小时详细数据
        daily: dailyForecast, // 15天每日数据
        source: 'open-meteo',
        forecast_days: maxDays
      };
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  /**
   * 获取AQI数据（可选，如果API密钥可用）
   */
  async fetchAQIData(latitude, longitude) {
    // 如果没有API密钥，返回默认值
    if (!this.aqiApiKey) {
      return { aqi: 50, status: 'good', source: 'default' };
    }

    try {
      // 使用AirVisual API（需要API密钥）
      const url = `https://api.airvisual.com/v2/nearest_city`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          key: this.aqiApiKey
        }
      });

      if (response.data && response.data.data && response.data.data.current) {
        const pollution = response.data.data.current.pollution;
        return {
          aqi: pollution.aqius || 50,
          status: this.getAQIStatus(pollution.aqius),
          source: 'airvisual'
        };
      }
    } catch (error) {
      console.warn('Failed to fetch AQI data, using default:', error.message);
    }

    return { aqi: 50, status: 'good', source: 'default' };
  }

  /**
   * 获取AQI状态
   */
  getAQIStatus(aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  /**
   * 获取完整的天气数据（包含AQI）
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {string} timezone - 时区
   * @param {number} forecastDays - 预报天数
   */
  async getCompleteWeatherData(latitude, longitude, timezone, forecastDays = 15) {
    try {
      const [weatherData, aqiData] = await Promise.all([
        this.fetchWeatherData(latitude, longitude, timezone, forecastDays),
        this.fetchAQIData(latitude, longitude)
      ]);

      // 合并数据
      return {
        ...weatherData,
        aqi: aqiData.aqi,
        aqi_status: aqiData.status
      };
    } catch (error) {
      console.error('Error getting complete weather data:', error);
      throw error;
    }
  }

  /**
   * 获取指定时间的天气数据
   */
  getWeatherAtTime(forecastData, targetTime) {
    const target = new Date(targetTime);
    
    // 优先从hourly数据中查找
    if (forecastData.hourly && forecastData.hourly.length > 0) {
      for (const hour of forecastData.hourly) {
        const hourTime = new Date(hour.timestamp);
        // 找到最接近目标时间的数据
        if (Math.abs(hourTime - target) < 3600000) { // 1小时内
          return hour;
        }
      }
    }
    
    // 如果没找到，从daily数据中查找
    if (forecastData.daily && forecastData.daily.length > 0) {
      const targetDate = target.toISOString().split('T')[0];
      for (const day of forecastData.daily) {
        if (day.date === targetDate) {
          // 返回当天的平均数据
          return {
            timestamp: day.date,
            temperature_c: (day.temperature_max + day.temperature_min) / 2,
            relative_humidity: null, // 每日数据中没有湿度
            wind_m_s: day.wind_speed_max,
            gust_m_s: day.wind_gust_max,
            uv_index: day.uv_index_max,
            precip_prob: day.precipitation_probability_max,
            precipitation: day.precipitation_sum
          };
        }
      }
    }

    // 如果都没找到，返回当前数据
    return forecastData.current;
  }
}

module.exports = WeatherService;
