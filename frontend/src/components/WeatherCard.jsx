import React from 'react';
import './WeatherCard.css';

const WeatherCard = ({ weather, location }) => {
  if (!weather) return null;

  const { current, aqi, aqi_status, daily } = weather;

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: '优', color: '#4CAF50' };
    if (aqi <= 100) return { label: '良', color: '#8BC34A' };
    if (aqi <= 150) return { label: '轻度污染', color: '#FFC107' };
    if (aqi <= 200) return { label: '中度污染', color: '#FF9800' };
    if (aqi <= 300) return { label: '重度污染', color: '#F44336' };
    return { label: '严重污染', color: '#D32F2F' };
  };

  const aqiInfo = getAQIStatus(aqi);

  // 获取今天的最高和最低温度（daily数组的第一项是今天）
  const todayForecast = daily && daily.length > 0 ? daily[0] : null;
  const maxTemp = todayForecast ? Math.round(todayForecast.temperature_max) : null;
  const minTemp = todayForecast ? Math.round(todayForecast.temperature_min) : null;

  return (
    <div className="weather-card">
      <div className="weather-main">
        <div className="temperature-display">
          <span className="temperature">{Math.round(current.temperature_c)}°</span>
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
            <span className="detail-value">{current.relative_humidity}%</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">风速</span>
            <span className="detail-value">{current.wind_m_s?.toFixed(1)} m/s</span>
          </div>
          <div className="weather-detail-item">
            <span className="detail-label">紫外线</span>
            <span className="detail-value">{current.uv_index || 0}</span>
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
