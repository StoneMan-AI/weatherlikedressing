import React, { useState, useMemo } from 'react';
import './WeatherDetail.css';

const WeatherDetail = ({ weatherData }) => {
  const [selectedView, setSelectedView] = useState('temperature'); // temperature, wind, uv, precipitation, humidity
  const [tempType, setTempType] = useState('actual'); // actual or feelsLike

  if (!weatherData || !weatherData.hourly) {
    return null;
  }

  const { hourly, daily, current } = weatherData;

  // 获取当天的小时数据（24小时）
  const todayHours = hourly.slice(0, 24);

  // 获取当前时间索引
  const now = new Date();
  const currentHourIndex = useMemo(() => {
    for (let i = 0; i < todayHours.length; i++) {
      const hourTime = new Date(todayHours[i].timestamp);
      if (hourTime >= now) {
        return i;
      }
    }
    return 0;
  }, [todayHours, now]);

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

  // 生成SVG路径点
  const generatePathPoints = (values, min, max, range, width, height, padding = 20) => {
    const points = [];
    const stepX = (width - padding * 2) / (values.length - 1);
    
    values.forEach((value, index) => {
      const x = padding + index * stepX;
      const normalizedY = ((value - min) / range) * (height - padding * 2);
      const y = height - padding - normalizedY;
      points.push({ x, y, value });
    });
    
    return points;
  };

  // 生成平滑曲线路径
  const generateSmoothPath = (points) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 2;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) / 2;
      const controlY2 = next.y;
      
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  // 生成填充区域路径
  const generateFillPath = (points, height, padding = 20) => {
    if (points.length < 2) return '';
    
    const path = generateSmoothPath(points);
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = height - padding;
    
    return `${path} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const renderTemperatureChart = () => {
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = 20;
    
    const values = todayHours.map(h => h.temperature_c);
    const points = generatePathPoints(values, minTemp, maxTemp, tempRange, chartWidth, chartHeight, padding);
    const linePath = generateSmoothPath(points);
    const fillPath = generateFillPath(points, chartHeight, padding);
    
    // 找到最低和最高点
    const minPoint = points.reduce((min, p) => p.value < min.value ? p : min, points[0]);
    const maxPoint = points.reduce((max, p) => p.value > max.value ? p : max, points[0]);
    
    return (
      <div className="weather-chart temperature-chart">
        <div className="chart-header">
          <div className="current-temp-info">
            <span className="current-temp">{Math.round(current.temperature_c)}°</span>
            <div className="temp-range-text">
              <span className="temp-high">最高{Math.round(maxTemp)}°</span>
              <span className="temp-low">最低{Math.round(minTemp)}°</span>
            </div>
          </div>
        </div>
        
        <div className="chart-wrapper">
          <svg 
            className="line-chart" 
            width="100%" 
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            {/* 渐变定义 */}
            <defs>
              <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 193, 7, 0.3)" />
                <stop offset="50%" stopColor="rgba(255, 152, 0, 0.4)" />
                <stop offset="100%" stopColor="rgba(255, 87, 34, 0.2)" />
              </linearGradient>
            </defs>
            
            {/* 填充区域 */}
            <path 
              d={fillPath} 
              fill="url(#tempGradient)" 
              className="chart-fill"
            />
            
            {/* 温度曲线 */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="#FFC107" 
              strokeWidth="2" 
              strokeDasharray="4,2"
              className="chart-line"
            />
            
            {/* 最低点标记 */}
            <g className="min-marker">
              <circle cx={minPoint.x} cy={minPoint.y} r="4" fill="#64B5F6" />
              <text 
                x={minPoint.x} 
                y={minPoint.y - 10} 
                fill="#64B5F6" 
                fontSize="12" 
                textAnchor="middle"
                fontWeight="500"
              >
                最低
              </text>
              <text 
                x={minPoint.x} 
                y={minPoint.y + 20} 
                fill="rgba(255, 255, 255, 0.7)" 
                fontSize="11" 
                textAnchor="middle"
              >
                {Math.round(minPoint.value)}°
              </text>
            </g>
            
            {/* 最高点标记 */}
            <g className="max-marker">
              <circle cx={maxPoint.x} cy={maxPoint.y} r="4" fill="#FF9800" />
              <text 
                x={maxPoint.x} 
                y={maxPoint.y - 10} 
                fill="#FF9800" 
                fontSize="12" 
                textAnchor="middle"
                fontWeight="500"
              >
                最高
              </text>
              <text 
                x={maxPoint.x} 
                y={maxPoint.y + 20} 
                fill="rgba(255, 255, 255, 0.7)" 
                fontSize="11" 
                textAnchor="middle"
              >
                {Math.round(maxPoint.value)}°
              </text>
            </g>
            
            {/* 当前温度标记 */}
            {currentHourIndex < points.length && (
              <g className="current-marker">
                <circle 
                  cx={points[currentHourIndex].x} 
                  cy={points[currentHourIndex].y} 
                  r="6" 
                  fill="white" 
                  stroke="#FFC107" 
                  strokeWidth="2"
                />
                <text 
                  x={points[currentHourIndex].x} 
                  y={points[currentHourIndex].y - 15} 
                  fill="white" 
                  fontSize="12" 
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {Math.round(points[currentHourIndex].value)}°
                </text>
              </g>
            )}
          </svg>
          
          {/* X轴标签 */}
          <div className="chart-x-axis">
            {todayHours.map((hour, index) => {
              const time = new Date(hour.timestamp);
              const hourLabel = time.getHours();
              const showLabel = hourLabel === 0 || hourLabel === 6 || hourLabel === 12 || hourLabel === 18;
              
              if (!showLabel) return null;
              
              return (
                <span 
                  key={index} 
                  className="axis-label"
                  style={{ 
                    left: `${(index / (todayHours.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {hourLabel}时
                </span>
              );
            })}
          </div>
          
          {/* Y轴标签 */}
          <div className="chart-y-axis">
            {[maxTemp, (maxTemp + minTemp) / 2, minTemp].map((temp, index) => (
              <span 
                key={index}
                className="axis-label"
                style={{ 
                  top: `${index * 50}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                {Math.round(temp)}°
              </span>
            ))}
          </div>
        </div>
        
        {/* 温度类型切换按钮 */}
        <div className="temp-type-selector">
          <button
            className={`temp-type-btn ${tempType === 'actual' ? 'active' : ''}`}
            onClick={() => setTempType('actual')}
          >
            实际气温
          </button>
          <button
            className={`temp-type-btn ${tempType === 'feelsLike' ? 'active' : ''}`}
            onClick={() => setTempType('feelsLike')}
          >
            体感温度
          </button>
        </div>
      </div>
    );
  };

  const renderWindChart = () => {
    const windRange = getValueRange('wind_m_s');
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = 20;
    
    const values = todayHours.map(h => h.wind_m_s || 0);
    const points = generatePathPoints(values, windRange.min, windRange.max, windRange.range, chartWidth, chartHeight, padding);
    const linePath = generateSmoothPath(points);
    const fillPath = generateFillPath(points, chartHeight, padding);
    
    return (
      <div className="weather-chart line-chart-container">
        <div className="chart-wrapper">
          <svg 
            className="line-chart" 
            width="100%" 
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(100, 181, 246, 0.2)" />
                <stop offset="100%" stopColor="rgba(33, 150, 243, 0.3)" />
              </linearGradient>
            </defs>
            
            <path d={fillPath} fill="url(#windGradient)" className="chart-fill" />
            <path 
              d={linePath} 
              fill="none" 
              stroke="#64B5F6" 
              strokeWidth="2" 
              className="chart-line"
            />
          </svg>
          
          <div className="chart-x-axis">
            {todayHours.map((hour, index) => {
              const time = new Date(hour.timestamp);
              const hourLabel = time.getHours();
              const showLabel = hourLabel === 0 || hourLabel === 6 || hourLabel === 12 || hourLabel === 18;
              if (!showLabel) return null;
              return (
                <span 
                  key={index} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hourLabel}时
                </span>
              );
            })}
          </div>
        </div>
        <div className="chart-legend">
          <span>风速 (m/s)</span>
        </div>
      </div>
    );
  };

  const renderUVChart = () => {
    const uvRange = getValueRange('uv_index');
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = 20;
    
    const values = todayHours.map(h => h.uv_index || 0);
    const points = generatePathPoints(values, uvRange.min, uvRange.max, uvRange.range, chartWidth, chartHeight, padding);
    const linePath = generateSmoothPath(points);
    const fillPath = generateFillPath(points, chartHeight, padding);
    
    return (
      <div className="weather-chart line-chart-container">
        <div className="chart-wrapper">
          <svg 
            className="line-chart" 
            width="100%" 
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="uvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 235, 59, 0.2)" />
                <stop offset="100%" stopColor="rgba(255, 193, 7, 0.3)" />
              </linearGradient>
            </defs>
            
            <path d={fillPath} fill="url(#uvGradient)" className="chart-fill" />
            <path 
              d={linePath} 
              fill="none" 
              stroke="#FFC107" 
              strokeWidth="2" 
              className="chart-line"
            />
          </svg>
          
          <div className="chart-x-axis">
            {todayHours.map((hour, index) => {
              const time = new Date(hour.timestamp);
              const hourLabel = time.getHours();
              const showLabel = hourLabel === 0 || hourLabel === 6 || hourLabel === 12 || hourLabel === 18;
              if (!showLabel) return null;
              return (
                <span 
                  key={index} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hourLabel}时
                </span>
              );
            })}
          </div>
        </div>
        <div className="chart-legend">
          <span>紫外线指数</span>
        </div>
      </div>
    );
  };

  const renderPrecipitationChart = () => {
    const precipRange = getValueRange('precip_prob');
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = 20;
    
    const values = todayHours.map(h => h.precip_prob || 0);
    const points = generatePathPoints(values, precipRange.min, precipRange.max, precipRange.range, chartWidth, chartHeight, padding);
    const linePath = generateSmoothPath(points);
    const fillPath = generateFillPath(points, chartHeight, padding);
    
    return (
      <div className="weather-chart line-chart-container">
        <div className="chart-wrapper">
          <svg 
            className="line-chart" 
            width="100%" 
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="precipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(33, 150, 243, 0.2)" />
                <stop offset="100%" stopColor="rgba(25, 118, 210, 0.3)" />
              </linearGradient>
            </defs>
            
            <path d={fillPath} fill="url(#precipGradient)" className="chart-fill" />
            <path 
              d={linePath} 
              fill="none" 
              stroke="#2196F3" 
              strokeWidth="2" 
              className="chart-line"
            />
          </svg>
          
          <div className="chart-x-axis">
            {todayHours.map((hour, index) => {
              const time = new Date(hour.timestamp);
              const hourLabel = time.getHours();
              const showLabel = hourLabel === 0 || hourLabel === 6 || hourLabel === 12 || hourLabel === 18;
              if (!showLabel) return null;
              return (
                <span 
                  key={index} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hourLabel}时
                </span>
              );
            })}
          </div>
        </div>
        <div className="chart-legend">
          <span>降水概率 (%)</span>
        </div>
      </div>
    );
  };

  const renderHumidityChart = () => {
    const humidityRange = getValueRange('relative_humidity');
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = 20;
    
    const values = todayHours.map(h => h.relative_humidity);
    const points = generatePathPoints(values, humidityRange.min, humidityRange.max, humidityRange.range, chartWidth, chartHeight, padding);
    const linePath = generateSmoothPath(points);
    const fillPath = generateFillPath(points, chartHeight, padding);
    
    return (
      <div className="weather-chart line-chart-container">
        <div className="chart-wrapper">
          <svg 
            className="line-chart" 
            width="100%" 
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="humidityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(144, 202, 249, 0.2)" />
                <stop offset="100%" stopColor="rgba(66, 165, 245, 0.3)" />
              </linearGradient>
            </defs>
            
            <path d={fillPath} fill="url(#humidityGradient)" className="chart-fill" />
            <path 
              d={linePath} 
              fill="none" 
              stroke="#90CAF9" 
              strokeWidth="2" 
              className="chart-line"
            />
          </svg>
          
          <div className="chart-x-axis">
            {todayHours.map((hour, index) => {
              const time = new Date(hour.timestamp);
              const hourLabel = time.getHours();
              const showLabel = hourLabel === 0 || hourLabel === 6 || hourLabel === 12 || hourLabel === 18;
              if (!showLabel) return null;
              return (
                <span 
                  key={index} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hourLabel}时
                </span>
              );
            })}
          </div>
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

