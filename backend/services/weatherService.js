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
   */
  async fetchWeatherData(latitude, longitude, timezone = 'Asia/Shanghai') {
    try {
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
          'precipitation_probability'
        ].join(','),
        forecast_days: 3
      };

      const response = await axios.get(this.openMeteoBaseUrl, { params });
      const data = response.data;

      if (!data.hourly) {
        throw new Error('Invalid weather data response');
      }

      // 处理小时数据，返回当前时间和未来48小时
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

      // 提取当前和未来的数据
      const currentWeather = {
        timestamp: timeArray[currentIndex],
        temperature_c: hourly.temperature_2m[currentIndex],
        relative_humidity: hourly.relativehumidity_2m[currentIndex],
        wind_m_s: hourly.wind_speed_10m[currentIndex],
        gust_m_s: hourly.wind_gusts_10m[currentIndex] || 0,
        uv_index: hourly.uv_index[currentIndex] || 0,
        precip_prob: hourly.precipitation_probability[currentIndex] || 0
      };

      // 提取未来48小时数据（用于预测）
      const forecastHours = [];
      for (let i = currentIndex; i < Math.min(currentIndex + 48, timeArray.length); i++) {
        forecastHours.push({
          timestamp: timeArray[i],
          temperature_c: hourly.temperature_2m[i],
          relative_humidity: hourly.relativehumidity_2m[i],
          wind_m_s: hourly.wind_speed_10m[i],
          gust_m_s: hourly.wind_gusts_10m[i] || 0,
          uv_index: hourly.uv_index[i] || 0,
          precip_prob: hourly.precipitation_probability[i] || 0
        });
      }

      return {
        current: currentWeather,
        forecast: forecastHours,
        source: 'open-meteo'
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
   */
  async getCompleteWeatherData(latitude, longitude, timezone) {
    try {
      const [weatherData, aqiData] = await Promise.all([
        this.fetchWeatherData(latitude, longitude, timezone),
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
    
    for (const hour of forecastData.forecast) {
      const hourTime = new Date(hour.timestamp);
      // 找到最接近目标时间的数据
      if (Math.abs(hourTime - target) < 3600000) { // 1小时内
        return hour;
      }
    }

    // 如果没找到，返回第一个预测数据
    return forecastData.forecast[0] || forecastData.current;
  }
}

module.exports = WeatherService;
