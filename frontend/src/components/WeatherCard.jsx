import React from 'react';
import './WeatherCard.css';

const WeatherCard = ({ weather, location }) => {
  if (!weather) return null;

  const { current, aqi, aqi_status, daily, hourly } = weather;

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: '优', color: '#4CAF55' };
    if (aqi <= 100) return { label: '良', color: '#8BC34A' };
    if (aqi <= 150) return { label: '轻度污染', color: '#FFC107' };
    if (aqi <= 200) return { label: '中度污染', color: '#FF9800' };
    if (aqi <= 300) return { label: '重度污染', color: '#F44336' };
    return { label: '严重污染', color: '#D32F2F' };
  };

  const aqiInfo = getAQIStatus(aqi);

  // 获取当前时间在指定时区的小时索引（与WeatherDetail保持一致）
  const getCurrentHourIndex = () => {
    if (!location?.timezone) return null;
    
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: location.timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    return hour;
  };

  // 从hourly数据中获取当前小时的天气数据（与WeatherDetail保持一致）
  const getCurrentHourDataFromHourly = () => {
    if (!hourly || hourly.length === 0) {
      return {
        temperature_c: current?.temperature_c || 0,
        relative_humidity: current?.relative_humidity || 0,
        wind_m_s: current?.wind_m_s || 0,
        uv_index: current?.uv_index || 0
      };
    }

    const currentHourIndex = getCurrentHourIndex();
    if (currentHourIndex === null) {
      return {
        temperature_c: current?.temperature_c || 0,
        relative_humidity: current?.relative_humidity || 0,
        wind_m_s: current?.wind_m_s || 0,
        uv_index: current?.uv_index || 0
      };
    }

    // 获取今天0时在指定时区的时间
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: location?.timezone || 'Asia/Shanghai',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const dateStr = formatter.format(now);
    const [month, day, year] = dateStr.split('/');
    const todayStart = new Date(year, month - 1, day, 0, 0);

    // 找到当前小时对应的数据点
    let closestHour = null;
    let minDiff = Infinity;

    for (const hour of hourly) {
      const hourTime = new Date(hour.timestamp);
      const targetTime = new Date(todayStart);
      targetTime.setHours(currentHourIndex);

      const diff = Math.abs(hourTime.getTime() - targetTime.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestHour = hour;
      }
    }

    // 如果找到了数据点且时间差在1小时内，使用它；否则使用current数据
    if (closestHour && minDiff < 3600000) {
      return {
        temperature_c: closestHour.temperature_c || 0,
        relative_humidity: closestHour.relative_humidity || 0,
        wind_m_s: closestHour.wind_m_s || 0,
        uv_index: closestHour.uv_index || 0
      };
    }

    return {
      temperature_c: current?.temperature_c || 0,
      relative_humidity: current?.relative_humidity || 0,
      wind_m_s: current?.wind_m_s || 0,
      uv_index: current?.uv_index || 0
    };
  };

  // 获取当前小时的天气数据
  const currentHourData = getCurrentHourDataFromHourly();

  // 获取今天的最高和最低温度
  // 优先从hourly数据计算（更准确），如果没有则从daily数据获取
  const getTodayTemps = () => {
    // 使用与WeatherDetail相同的方式获取当前温度
    const currentTemp = Math.round(currentHourData.temperature_c);
    let maxTemp = currentTemp;
    let minTemp = currentTemp;
    
    // 方法1：从hourly数据计算今天的最高最低温度（最准确）
    if (hourly && hourly.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayTemps = [];
      for (const hour of hourly) {
        const hourDate = new Date(hour.timestamp);
        if (hourDate >= today && hourDate < tomorrow) {
          todayTemps.push(hour.temperature_c);
        }
      }
      
      if (todayTemps.length > 0) {
        maxTemp = Math.round(Math.max(...todayTemps));
        minTemp = Math.round(Math.min(...todayTemps));
        return { maxTemp, minTemp, currentTemp };
      }
    }
    
    // 方法2：从daily数据获取（备用方案）
    if (daily && daily.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 查找今天对应的daily数据
      for (let i = 0; i < daily.length; i++) {
        const dayDate = new Date(daily[i].date || daily[i].time);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate.getTime() === today.getTime()) {
          maxTemp = Math.round(daily[i].temperature_max);
          minTemp = Math.round(daily[i].temperature_min);
          break;
        }
      }
    }
    
    // 数据验证：确保最高温度 >= 当前温度 >= 最低温度
    if (maxTemp < currentTemp) {
      maxTemp = currentTemp;
    }
    if (minTemp > currentTemp) {
      minTemp = currentTemp;
    }
    
    return { maxTemp, minTemp, currentTemp };
  };

  const { maxTemp, minTemp, currentTemp } = getTodayTemps();

  return (
    <div className="weather-card">
      <div className="weather-main">
        <div className="temperature-display">
          <span className="temperature">{currentTemp}°</span>
          {(maxTemp !== null || minTemp !== null) && (
            <div className="temp-range">
              {maxTemp !== null && <span className="temp-max">{maxTemp}°</span>}
              {minTemp !== null && <span className="temp-min">{minTemp}°</span>}
            </div>
          )}
        </div>
        <div className="weather-details-row">
          <div className="weather-detail-item">
            <span className="detail-label">湿度</span>
            <span className="detail-value">{Math.round(currentHourData.relative_humidity)}%</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">风速</span>
            <span className="detail-value">{currentHourData.wind_m_s?.toFixed(1)} m/s</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">紫外线</span>
            <span className="detail-value">{Math.round(currentHourData.uv_index) || 0}</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">空气质量</span>
            <span className="detail-value aqi-value" style={{ color: aqiInfo.color }}>
              {aqiInfo.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
