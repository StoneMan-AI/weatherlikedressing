import React, { useState } from 'react';
import './WeatherDetail.css';

const WeatherDetail = ({ weatherData }) => {
  const [selectedView, setSelectedView] = useState('temperature'); // temperature, wind, uv, precipitation, humidity

  if (!weatherData || !weatherData.hourly) {
    return null;
  }

  const { hourly, daily, current } = weatherData;

  // 获取当天的小时数据（24小时）
  const todayHours = hourly.slice(0, 24);

  // 获取最高和最低温度
  const temperatures = todayHours.map(h => h.temperature_c);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);
  const tempRange = maxTemp - minTemp || 1;

  // 获取当前值范围
  const getValueRange = (key) => {
    const values = todayHours.map(h => h[key] || 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      range: Math.max(...values) - Math.min(...values) || 1
    };
  };

  const renderTemperatureChart = () => {
    return (
      <div className="weather-chart">
        <div className="chart-container">
          {todayHours.map((hour, index) => {
            const time = new Date(hour.timestamp);
            const hourLabel = time.getHours();
            const normalizedTemp = ((hour.temperature_c - minTemp) / tempRange) * 100;
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar temperature-bar"
                    style={{ height: `${normalizedTemp}%` }}
                  >
                    <span className="chart-value">{Math.round(hour.temperature_c)}°</span>
                  </div>
                </div>
                <span className="chart-label">
                  {hourLabel === 0 ? '0时' : hourLabel === 12 ? '12时' : hourLabel === 6 ? '6时' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span>最低 {Math.round(minTemp)}°</span>
          <span>最高 {Math.round(maxTemp)}°</span>
        </div>
      </div>
    );
  };

  const renderWindChart = () => {
    const windRange = getValueRange('wind_m_s');
    return (
      <div className="weather-chart">
        <div className="chart-container">
          {todayHours.map((hour, index) => {
            const time = new Date(hour.timestamp);
            const hourLabel = time.getHours();
            const normalizedWind = ((hour.wind_m_s - windRange.min) / windRange.range) * 100;
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar wind-bar"
                    style={{ height: `${normalizedWind}%` }}
                  >
                    <span className="chart-value">{hour.wind_m_s?.toFixed(1)}</span>
                  </div>
                </div>
                <span className="chart-label">
                  {hourLabel === 0 ? '0时' : hourLabel === 12 ? '12时' : hourLabel === 6 ? '6时' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span>风速 (m/s)</span>
        </div>
      </div>
    );
  };

  const renderUVChart = () => {
    const uvRange = getValueRange('uv_index');
    return (
      <div className="weather-chart">
        <div className="chart-container">
          {todayHours.map((hour, index) => {
            const time = new Date(hour.timestamp);
            const hourLabel = time.getHours();
            const normalizedUV = ((hour.uv_index - uvRange.min) / uvRange.range) * 100;
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar uv-bar"
                    style={{ height: `${normalizedUV}%` }}
                  >
                    <span className="chart-value">{hour.uv_index || 0}</span>
                  </div>
                </div>
                <span className="chart-label">
                  {hourLabel === 0 ? '0时' : hourLabel === 12 ? '12时' : hourLabel === 6 ? '6时' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span>紫外线指数</span>
        </div>
      </div>
    );
  };

  const renderPrecipitationChart = () => {
    const precipRange = getValueRange('precip_prob');
    return (
      <div className="weather-chart">
        <div className="chart-container">
          {todayHours.map((hour, index) => {
            const time = new Date(hour.timestamp);
            const hourLabel = time.getHours();
            const normalizedPrecip = ((hour.precip_prob - precipRange.min) / precipRange.range) * 100;
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar precipitation-bar"
                    style={{ height: `${normalizedPrecip}%` }}
                  >
                    <span className="chart-value">{hour.precip_prob || 0}%</span>
                  </div>
                </div>
                <span className="chart-label">
                  {hourLabel === 0 ? '0时' : hourLabel === 12 ? '12时' : hourLabel === 6 ? '6时' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span>降水概率 (%)</span>
        </div>
      </div>
    );
  };

  const renderHumidityChart = () => {
    const humidityRange = getValueRange('relative_humidity');
    return (
      <div className="weather-chart">
        <div className="chart-container">
          {todayHours.map((hour, index) => {
            const time = new Date(hour.timestamp);
            const hourLabel = time.getHours();
            const normalizedHumidity = ((hour.relative_humidity - humidityRange.min) / humidityRange.range) * 100;
            
            return (
              <div key={index} className="chart-item">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar humidity-bar"
                    style={{ height: `${normalizedHumidity}%` }}
                  >
                    <span className="chart-value">{hour.relative_humidity}%</span>
                  </div>
                </div>
                <span className="chart-label">
                  {hourLabel === 0 ? '0时' : hourLabel === 12 ? '12时' : hourLabel === 6 ? '6时' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span>湿度 (%)</span>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (selectedView) {
      case 'temperature':
        return renderTemperatureChart();
      case 'wind':
        return renderWindChart();
      case 'uv':
        return renderUVChart();
      case 'precipitation':
        return renderPrecipitationChart();
      case 'humidity':
        return renderHumidityChart();
      default:
        return renderTemperatureChart();
    }
  };

  return (
    <div className="weather-detail">
      <div className="weather-detail-header">
        <h3>天气详情</h3>
        <div className="view-selector">
          <button
            className={`view-btn ${selectedView === 'temperature' ? 'active' : ''}`}
            onClick={() => setSelectedView('temperature')}
          >
            气温
          </button>
          <button
            className={`view-btn ${selectedView === 'wind' ? 'active' : ''}`}
            onClick={() => setSelectedView('wind')}
          >
            风速
          </button>
          <button
            className={`view-btn ${selectedView === 'uv' ? 'active' : ''}`}
            onClick={() => setSelectedView('uv')}
          >
            紫外线
          </button>
          <button
            className={`view-btn ${selectedView === 'precipitation' ? 'active' : ''}`}
            onClick={() => setSelectedView('precipitation')}
          >
            降水
          </button>
          <button
            className={`view-btn ${selectedView === 'humidity' ? 'active' : ''}`}
            onClick={() => setSelectedView('humidity')}
          >
            湿度
          </button>
        </div>
      </div>
      {renderChart()}
    </div>
  );
};

export default WeatherDetail;

