import React, { useState, useMemo } from 'react';
import './WeatherDetail.css';

const WeatherDetail = ({ weatherData, timezone = 'Asia/Shanghai' }) => {
  const [selectedView, setSelectedView] = useState('temperature'); // temperature, wind, uv, precipitation, humidity
  const [tempType, setTempType] = useState('actual'); // actual or feelsLike

  if (!weatherData || !weatherData.hourly) {
    return null;
  }

  const { hourly, daily, current } = weatherData;

  // 获取目标时区今天的0点时间戳（ISO字符串格式，用于比较）
  const getTodayStartInTimezone = useMemo(() => {
    const now = new Date();
    // 获取目标时区今天的日期字符串（YYYY-MM-DD）
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // en-CA格式: YYYY-MM-DD
    // 创建目标时区今天0点的ISO字符串
    return `${dateStr}T00:00:00`;
  }, [timezone]);

  // 获取目标时区的当前时间（ISO字符串格式）
  const getCurrentTimeInTimezone = useMemo(() => {
    const now = new Date();
    // 获取目标时区的当前时间字符串
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const timeStr = now.toLocaleTimeString('en-US', { 
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `${dateStr}T${timeStr}`;
  }, [timezone]);

  // 获取当天0点到24点的小时数据（24小时，0时到23时）
  const todayHours = useMemo(() => {
    if (!hourly || hourly.length === 0) return [];
    
    const todayStartStr = getTodayStartInTimezone;
    const todayStartDate = new Date(todayStartStr);
    
    // 找到今天0点对应的数据点
    let startIndex = -1;
    let minDiff = Infinity;
    
    for (let i = 0; i < hourly.length; i++) {
      const hourTimeStr = hourly[i].timestamp;
      const hourTime = new Date(hourTimeStr);
      
      // 检查是否是今天的数据（在同一天）
      const hourDateStr = hourTime.toLocaleDateString('en-CA', { timeZone: timezone });
      const todayDateStr = todayStartDate.toLocaleDateString('en-CA', { timeZone: timezone });
      
      if (hourDateStr === todayDateStr) {
        // 找到0点的数据
        const hour = hourTime.toLocaleTimeString('en-US', { 
          timeZone: timezone,
          hour12: false,
          hour: '2-digit'
        });
        
        if (hour === '00' || hour === '0') {
          startIndex = i;
          break;
        }
        
        // 记录最接近0点的索引
        const diff = Math.abs(hourTime.getTime() - todayStartDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          startIndex = i;
        }
      }
    }
    
    // 如果没找到今天的数据，尝试找最接近今天0点的
    if (startIndex === -1) {
      for (let i = 0; i < hourly.length; i++) {
        const hourTime = new Date(hourly[i].timestamp);
        const diff = Math.abs(hourTime.getTime() - todayStartDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          startIndex = i;
        }
      }
    }
    
    // 如果还是没找到，使用第一个数据点
    if (startIndex === -1) {
      startIndex = 0;
    }
    
    // 获取24小时的数据（0时到23时，共24个点）
    const hours24 = hourly.slice(startIndex, startIndex + 24);
    
    // 如果数据不足24个，尝试从前面补充
    if (hours24.length < 24) {
      // 如果startIndex前面还有数据，尝试补充
      if (startIndex > 0) {
        const needed = 24 - hours24.length;
        const before = hourly.slice(Math.max(0, startIndex - needed), startIndex);
        return [...before, ...hours24].slice(-24);
      }
    }
    
    return hours24.length >= 24 ? hours24.slice(0, 24) : hours24;
  }, [hourly, getTodayStartInTimezone, timezone]);

  // 获取当前时间索引（在24小时数据中的位置，0-23）
  const currentHourIndex = useMemo(() => {
    if (todayHours.length === 0) return 0;
    
    const currentTimeStr = getCurrentTimeInTimezone;
    const currentTime = new Date(currentTimeStr);
    const todayStartStr = getTodayStartInTimezone;
    const todayStart = new Date(todayStartStr);
    
    // 计算当前时间距离今天0点的小时数
    const hoursDiff = (currentTime.getTime() - todayStart.getTime()) / (1000 * 60 * 60);
    
    // 当前小时索引（0-23）
    let currentHour = Math.floor(hoursDiff);
    
    // 确保索引在有效范围内
    if (currentHour < 0) currentHour = 0;
    if (currentHour >= todayHours.length) currentHour = todayHours.length - 1;
    
    // 验证：检查当前索引对应的数据点是否确实是过去的数据
    if (currentHour < todayHours.length) {
      const hourTime = new Date(todayHours[currentHour].timestamp);
      const hourTimeStr = hourTime.toLocaleString('en-US', { 
        timeZone: timezone,
        hour12: false,
        hour: '2-digit'
      });
      const currentHourStr = currentTime.toLocaleString('en-US', { 
        timeZone: timezone,
        hour12: false,
        hour: '2-digit'
      });
      
      // 如果数据点的时间已经超过当前时间，向前调整
      if (hourTime > currentTime && currentHour > 0) {
        currentHour = currentHour - 1;
      }
    }
    
    return currentHour;
  }, [todayHours, getCurrentTimeInTimezone, getTodayStartInTimezone, timezone]);

  // 获取最高和最低温度（扩大范围，让波动不那么明显）
  const temperatures = todayHours.map(h => h.temperature_c);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);
  // 扩大Y轴范围，增加上下各20%的缓冲空间
  const tempRange = (maxTemp - minTemp) * 1.4 || 1;
  const adjustedMinTemp = minTemp - (tempRange * 0.2);
  const adjustedMaxTemp = maxTemp + (tempRange * 0.2);

  // 获取当前值范围（扩大范围，让波动不那么明显）
  const getValueRange = (key) => {
    const values = todayHours.map(h => h[key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) * 1.4 || 1; // 增加40%的缓冲空间
    return {
      min: min - (range * 0.2), // 向下扩展20%
      max: max + (range * 0.2), // 向上扩展20%
      range: range
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

  // 生成平滑曲线路径（支持分段：过去用虚线，未来用实线）
  const generateSmoothPath = (points, splitIndex = -1) => {
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

  // 生成过去时间的路径（虚线）
  const generatePastPath = (points, splitIndex) => {
    if (splitIndex <= 0 || splitIndex >= points.length) return '';
    if (points.length < 2) return '';
    
    // 如果splitIndex为0，没有过去的数据
    if (splitIndex === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    // 绘制到当前时间点之前的所有点
    for (let i = 0; i < splitIndex; i++) {
      if (i + 1 >= points.length) break;
      
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

  // 生成未来时间的路径（实线）
  const generateFuturePath = (points, splitIndex) => {
    if (splitIndex < 0 || splitIndex >= points.length - 1) {
      // 如果没有分割点，返回完整路径
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
    }
    
    if (points.length < 2) return '';
    
    // 从当前时间点开始绘制
    let path = `M ${points[splitIndex].x} ${points[splitIndex].y}`;
    
    // 绘制从当前时间点到未来的所有点
    for (let i = splitIndex; i < points.length - 1; i++) {
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
    const points = generatePathPoints(values, adjustedMinTemp, adjustedMaxTemp, tempRange, chartWidth, chartHeight, padding);
    
    // 分段路径：过去用虚线，未来用实线
    const pastPath = generatePastPath(points, currentHourIndex);
    const futurePath = generateFuturePath(points, currentHourIndex);
    const fullPath = generateSmoothPath(points);
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
            
            {/* 过去时间曲线（虚线） */}
            {pastPath && (
              <path 
                d={pastPath} 
                fill="none" 
                stroke="#FFC107" 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                className="chart-line chart-line-past"
                opacity="0.6"
              />
            )}
            
            {/* 未来时间曲线（实线） */}
            {futurePath && (
              <path 
                d={futurePath} 
                fill="none" 
                stroke="#FFC107" 
                strokeWidth="2.5" 
                className="chart-line chart-line-future"
              />
            )}
            
            {/* 当前时间分割线 */}
            {currentHourIndex > 0 && currentHourIndex < points.length && (
              <line
                x1={points[currentHourIndex].x}
                y1={padding}
                x2={points[currentHourIndex].x}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="current-time-divider"
              />
            )}
            
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
                y={minPoint.y + 25} 
                fill="rgba(255, 255, 255, 0.85)" 
                fontSize="16" 
                textAnchor="middle"
                fontWeight="500"
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
                y={maxPoint.y + 25} 
                fill="rgba(255, 255, 255, 0.85)" 
                fontSize="16" 
                textAnchor="middle"
                fontWeight="500"
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
                  y={points[currentHourIndex].y - 18} 
                  fill="white" 
                  fontSize="18" 
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {Math.round(points[currentHourIndex].value)}°
                </text>
              </g>
            )}
          </svg>
          
          {/* X轴标签（0-24时） */}
          <div className="chart-x-axis">
            {[0, 6, 12, 18, 24].map((hour) => {
              // 计算在24个数据点中的位置
              const index = hour === 24 ? todayHours.length - 1 : Math.floor((hour / 24) * (todayHours.length - 1));
              
              // 获取当前小时（在目标时区）
              const currentHour = Math.floor((getCurrentTimeInTimezone.getTime() - getTodayStartInTimezone.getTime()) / (1000 * 60 * 60));
              const isCurrentHour = hour <= currentHour && hour + 6 > currentHour;
              
              return (
                <span 
                  key={hour} 
                  className={`axis-label ${isCurrentHour ? 'current-hour' : ''}`}
                  style={{ 
                    left: `${(index / (todayHours.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {hour}时
                </span>
              );
            })}
          </div>
          
          {/* Y轴标签 */}
          <div className="chart-y-axis">
            {[adjustedMaxTemp, (adjustedMaxTemp + adjustedMinTemp) / 2, adjustedMinTemp].map((temp, index) => (
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
    const pastPath = generatePastPath(points, currentHourIndex);
    const futurePath = generateFuturePath(points, currentHourIndex);
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
            {pastPath && (
              <path 
                d={pastPath} 
                fill="none" 
                stroke="#64B5F6" 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                className="chart-line chart-line-past"
                opacity="0.6"
              />
            )}
            {futurePath && (
              <path 
                d={futurePath} 
                fill="none" 
                stroke="#64B5F6" 
                strokeWidth="2.5" 
                className="chart-line chart-line-future"
              />
            )}
            {currentHourIndex > 0 && currentHourIndex < points.length && (
              <line
                x1={points[currentHourIndex].x}
                y1={padding}
                x2={points[currentHourIndex].x}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="current-time-divider"
              />
            )}
          </svg>
          
          <div className="chart-x-axis">
            {[0, 6, 12, 18, 24].map((hour) => {
              const index = hour === 24 ? todayHours.length - 1 : Math.floor((hour / 24) * (todayHours.length - 1));
              return (
                <span 
                  key={hour} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hour}时
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
    const pastPath = generatePastPath(points, currentHourIndex);
    const futurePath = generateFuturePath(points, currentHourIndex);
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
            {pastPath && (
              <path 
                d={pastPath} 
                fill="none" 
                stroke="#FFC107" 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                className="chart-line chart-line-past"
                opacity="0.6"
              />
            )}
            {futurePath && (
              <path 
                d={futurePath} 
                fill="none" 
                stroke="#FFC107" 
                strokeWidth="2.5" 
                className="chart-line chart-line-future"
              />
            )}
            {currentHourIndex > 0 && currentHourIndex < points.length && (
              <line
                x1={points[currentHourIndex].x}
                y1={padding}
                x2={points[currentHourIndex].x}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="current-time-divider"
              />
            )}
          </svg>
          
          <div className="chart-x-axis">
            {[0, 6, 12, 18, 24].map((hour) => {
              const index = hour === 24 ? todayHours.length - 1 : Math.floor((hour / 24) * (todayHours.length - 1));
              return (
                <span 
                  key={hour} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hour}时
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
    const pastPath = generatePastPath(points, currentHourIndex);
    const futurePath = generateFuturePath(points, currentHourIndex);
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
            {pastPath && (
              <path 
                d={pastPath} 
                fill="none" 
                stroke="#2196F3" 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                className="chart-line chart-line-past"
                opacity="0.6"
              />
            )}
            {futurePath && (
              <path 
                d={futurePath} 
                fill="none" 
                stroke="#2196F3" 
                strokeWidth="2.5" 
                className="chart-line chart-line-future"
              />
            )}
            {currentHourIndex > 0 && currentHourIndex < points.length && (
              <line
                x1={points[currentHourIndex].x}
                y1={padding}
                x2={points[currentHourIndex].x}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="current-time-divider"
              />
            )}
          </svg>
          
          <div className="chart-x-axis">
            {[0, 6, 12, 18, 24].map((hour) => {
              const index = hour === 24 ? todayHours.length - 1 : Math.floor((hour / 24) * (todayHours.length - 1));
              return (
                <span 
                  key={hour} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hour}时
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
    const pastPath = generatePastPath(points, currentHourIndex);
    const futurePath = generateFuturePath(points, currentHourIndex);
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
            {pastPath && (
              <path 
                d={pastPath} 
                fill="none" 
                stroke="#90CAF9" 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                className="chart-line chart-line-past"
                opacity="0.6"
              />
            )}
            {futurePath && (
              <path 
                d={futurePath} 
                fill="none" 
                stroke="#90CAF9" 
                strokeWidth="2.5" 
                className="chart-line chart-line-future"
              />
            )}
            {currentHourIndex > 0 && currentHourIndex < points.length && (
              <line
                x1={points[currentHourIndex].x}
                y1={padding}
                x2={points[currentHourIndex].x}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="current-time-divider"
              />
            )}
          </svg>
          
          <div className="chart-x-axis">
            {[0, 6, 12, 18, 24].map((hour) => {
              const index = hour === 24 ? todayHours.length - 1 : Math.floor((hour / 24) * (todayHours.length - 1));
              return (
                <span 
                  key={hour} 
                  className="axis-label"
                  style={{ left: `${(index / (todayHours.length - 1)) * 100}%` }}
                >
                  {hour}时
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

