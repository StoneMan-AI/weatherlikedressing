import React from 'react';
import './WeatherCard.css';

const WeatherCard = ({ weather, location }) => {
  if (!weather) return null;

  const { current, aqi, aqi_status } = weather;

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: '优', color: '#4CAF50' };
    if (aqi <= 100) return { label: '良', color: '#8BC34A' };
    if (aqi <= 150) return { label: '轻度污染', color: '#FFC107' };
    if (aqi <= 200) return { label: '中度污染', color: '#FF9800' };
    if (aqi <= 300) return { label: '重度污染', color: '#F44336' };
    return { label: '严重污染', color: '#D32F2F' };
  };

  const aqiInfo = getAQIStatus(aqi);

  return (
    <div className="weather-card">
      <div className="weather-main">
        {/* 左侧3个方块 */}
        <div className="weather-left-column">
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
        </div>
        
        {/* 中间：温度（占2个方块） */}
        <div className="weather-center-column">
          <div className="temperature-display">
            <span className="temperature">{Math.round(current.temperature_c)}°</span>
          </div>
        </div>
        
        {/* 右侧3个方块 */}
        <div className="weather-right-column">
          <div className="weather-detail-item aqi-item">
            <span className="detail-label">空气质量</span>
            <span className="detail-value aqi-value" style={{ color: aqiInfo.color }}>
              {aqiInfo.label}
            </span>
          </div>
          <div className="weather-detail-item placeholder-item">
            {/* 占位方块，保持布局对称 */}
          </div>
          <div className="weather-detail-item placeholder-item">
            {/* 占位方块，保持布局对称 */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
