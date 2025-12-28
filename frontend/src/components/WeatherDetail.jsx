import React, { useState, useMemo } from 'react';
import './WeatherDetail.css';

const WeatherDetail = ({ weatherData, timezone = 'Asia/Shanghai' }) => {
  const [selectedView, setSelectedView] = useState('temperature'); // temperature, wind, uv, precipitation, humidity

  if (!weatherData || !weatherData.hourly) {
    return null;
  }

  const { hourly } = weatherData;

  // 获取当前时间在指定时区
  const getCurrentTimeInTimezone = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  }, [timezone]);

  // 获取今天的开始时间（0时）在指定时区
  const getTodayStartInTimezone = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const dateStr = formatter.format(now);
    const [month, day, year] = dateStr.split('/');
    return new Date(year, month - 1, day, 0, 0);
  }, [timezone]);

  // 获取今天24小时的数据（0时-23时）
  const todayHours = useMemo(() => {
    if (!hourly || hourly.length === 0) {
      return [];
    }
    
    const todayStart = getTodayStartInTimezone;
    const hours = [];
    
    // 将hourly数据按时间戳排序，确保顺序正确
    const sortedHourly = [...hourly].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // 创建一个映射，用于快速查找每个小时的数据
    const hourDataMap = new Map();
    for (const hour of sortedHourly) {
      const hourTime = new Date(hour.timestamp);
      // 转换为目标时区的小时
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
      });
      const hourStr = formatter.format(hourTime);
      const hourNum = parseInt(hourStr);
      
      // 如果这个小时还没有数据，或者这个数据更接近整点，则使用它
      if (!hourDataMap.has(hourNum)) {
        hourDataMap.set(hourNum, hour);
      } else {
        // 比较哪个更接近整点
        const existing = hourDataMap.get(hourNum);
        const existingTime = new Date(existing.timestamp);
        const currentTime = new Date(hour.timestamp);
        const targetTime = new Date(todayStart);
        targetTime.setHours(hourNum);
        
        const existingDiff = Math.abs(existingTime.getTime() - targetTime.getTime());
        const currentDiff = Math.abs(currentTime.getTime() - targetTime.getTime());
        
        if (currentDiff < existingDiff) {
          hourDataMap.set(hourNum, hour);
        }
      }
    }
    
    // 为每个小时（0-23）创建数据点
    for (let i = 0; i < 24; i++) {
      const targetTime = new Date(todayStart);
      targetTime.setHours(i);
      
      // 优先使用精确匹配的小时数据
      let hourData = hourDataMap.get(i);
      
      // 如果没有精确匹配，找到最接近的数据点
      if (!hourData) {
        let closestHour = null;
        let minDiff = Infinity;
        
        for (const hour of sortedHourly) {
          const hourTime = new Date(hour.timestamp);
          const diff = hourTime.getTime() - targetTime.getTime();
          const absDiff = Math.abs(diff);
          
          // 选择时间差最小的数据点（但优先选择未来的数据）
          if (absDiff < minDiff || (absDiff === minDiff && diff >= 0)) {
            minDiff = absDiff;
            closestHour = hour;
          }
        }
        
        hourData = closestHour;
      }
      
      // 确保每个小时都有数据
      if (hourData) {
        hours.push({
          ...hourData,
          hour: i,
          timestamp: targetTime.getTime()
        });
      } else {
        // 如果仍然没有数据，使用前一个小时的数据或默认值
        const prevHour = hours[hours.length - 1];
        hours.push({
          timestamp: targetTime.getTime(),
          hour: i,
          temperature_c: prevHour?.temperature_c || 0,
          relative_humidity: prevHour?.relative_humidity || 0,
          wind_m_s: prevHour?.wind_m_s || 0,
          gust_m_s: prevHour?.gust_m_s || 0,
          uv_index: prevHour?.uv_index || 0,
          precip_prob: prevHour?.precip_prob || 0,
          precipitation: prevHour?.precipitation || 0
        });
      }
    }
    
    // 调试信息 - 检查数据是否重复
    if (hours.length > 0) {
      // 计算当前小时索引用于调试（不依赖外部的currentHourIndex）
      const currentTime = getCurrentTimeInTimezone;
      const debugCurrentHourIndex = currentTime.getHours();
      
      // 检查是否有重复的数据点
      const uniqueTemps = new Set(hours.map(h => h.temperature_c));
      const uniqueTimestamps = new Set(hours.map(h => {
        // 使用原始数据的时间戳，而不是我们设置的目标时间戳
        const originalHour = sortedHourly.find(h2 => {
          const h2Time = new Date(h2.timestamp);
          const targetTime = new Date(todayStart);
          targetTime.setHours(h.hour);
          return Math.abs(h2Time.getTime() - targetTime.getTime()) < 30 * 60 * 1000;
        });
        return originalHour ? originalHour.timestamp : h.timestamp;
      }));
      
      // 如果所有温度都相同，发出警告
      if (uniqueTemps.size <= 2 && hours.length > 2) {
        // WeatherDetail: Warning - Most temperatures are the same!
      }
    }
    
    return hours;
  }, [hourly, getTodayStartInTimezone, timezone, getCurrentTimeInTimezone]);

  // 获取当前小时索引
  const currentHourIndex = useMemo(() => {
    const currentTime = getCurrentTimeInTimezone;
    const hour = currentTime.getHours();
    // WeatherDetail: Current hour index calculated
    return hour;
  }, [getCurrentTimeInTimezone]);

  // 获取值范围（扩大范围使曲线更平滑）
  const getValueRange = (key, expandPercent = 0.4) => {
    const values = todayHours.map(h => h[key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const expand = range * expandPercent;
    // 允许负数温度，不强制限制最小值为0
    const adjustedMin = min - expand;
    const adjustedMax = max + expand;
    return {
      min: adjustedMin,
      max: adjustedMax,
      range: adjustedMax - adjustedMin
    };
  };

  // 生成曲线路径（过去：虚线，未来：实线）
  const generatePath = (key, isPast) => {
    const range = getValueRange(key);
    const width = 600;
    const height = 300;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // 确保currentHourIndex在有效范围内
    const safeCurrentHourIndex = Math.max(0, Math.min(currentHourIndex, todayHours.length - 1));
    
    const points = todayHours.map((hour, index) => {
      const x = padding + (index / (todayHours.length - 1)) * chartWidth;
      const value = hour[key] || 0;
      const normalizedValue = ((value - range.min) / range.range);
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return { x, y, value, hour: hour.hour };
    });

    // 找到当前时间点
    const currentPoint = points[safeCurrentHourIndex];
    
    // 分离过去和未来的点
    // 过去：包含当前时间点及之前的所有点
    const pastPoints = points.slice(0, safeCurrentHourIndex + 1);
    // 未来：从当前时间点开始到结束的所有点（包含当前时间点，确保曲线连续）
    const futurePoints = points.slice(safeCurrentHourIndex);

    let path = '';
    
    if (isPast && pastPoints.length > 0) {
      // 过去：虚线
      path = `M ${pastPoints[0].x} ${pastPoints[0].y}`;
      for (let i = 1; i < pastPoints.length; i++) {
        const p1 = pastPoints[i - 1];
        const p2 = pastPoints[i];
        const cp1x = p1.x + (p2.x - p1.x) / 3;
        const cp1y = p1.y;
        const cp2x = p2.x - (p2.x - p1.x) / 3;
        const cp2y = p2.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    } else if (!isPast && futurePoints.length > 1) {
      // 未来：实线（需要至少2个点才能绘制曲线）
      path = `M ${futurePoints[0].x} ${futurePoints[0].y}`;
      for (let i = 1; i < futurePoints.length; i++) {
        const p1 = futurePoints[i - 1];
        const p2 = futurePoints[i];
        const cp1x = p1.x + (p2.x - p1.x) / 3;
        const cp1y = p1.y;
        const cp2x = p2.x - (p2.x - p1.x) / 3;
        const cp2y = p2.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      // 调试信息
      if (key === 'temperature_c') {
        // WeatherDetail: Future path generated
      }
    } else if (!isPast && futurePoints.length === 1) {
      // 如果只有一个点（当前时间点），至少绘制一个点
      path = `M ${futurePoints[0].x} ${futurePoints[0].y} L ${futurePoints[0].x} ${futurePoints[0].y}`;
      // WeatherDetail: Only one future point available
    }

    return { path, points, currentPoint, range };
  };

  // 生成渐变填充区域路径
  const generateFillPath = (key) => {
    const pathData = generatePath(key, false);
    const points = pathData.points;
    if (points.length === 0) return '';
    
    const width = 600;
    const height = 300;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const bottomY = padding + chartHeight;
    
    let fillPath = `M ${points[0].x} ${bottomY}`;
    
    // 绘制曲线
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        fillPath += ` L ${points[i].x} ${points[i].y}`;
      } else {
        const p1 = points[i - 1];
        const p2 = points[i];
        const cp1x = p1.x + (p2.x - p1.x) / 3;
        const cp1y = p1.y;
        const cp2x = p2.x - (p2.x - p1.x) / 3;
        const cp2y = p2.y;
        fillPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }
    
    // 闭合路径
    fillPath += ` L ${points[points.length - 1].x} ${bottomY} Z`;
    
    return fillPath;
  };

  // 渲染温度图表
  const renderTemperatureChart = () => {
    const pastPath = generatePath('temperature_c', true);
    const futurePath = generatePath('temperature_c', false);
    const fillPath = generateFillPath('temperature_c');
    const range = getValueRange('temperature_c');
    const { currentPoint } = pastPath;
    
    // 确保currentHourIndex在有效范围内
    const safeCurrentHourIndex = Math.max(0, Math.min(currentHourIndex, todayHours.length - 1));
    const gradientStopPercent = (safeCurrentHourIndex / 23) * 100;
    
    // 找到最高和最低温度点
    const temps = todayHours.map(h => h.temperature_c);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const maxIndex = temps.indexOf(maxTemp);
    const minIndex = temps.indexOf(minTemp);
    const maxPoint = pastPath.points[maxIndex];
    const minPoint = pastPath.points[minIndex];
    
    const padding = 30; // SVG内边距

    return (
      <div className="weather-chart">
        <div className="chart-wrapper">
          <svg width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" className="chart-svg">
            {/* 渐变定义 */}
            <defs>
              <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC107" stopOpacity="0.6" />
                <stop offset={`${gradientStopPercent}%`} stopColor="#FF9800" stopOpacity="0.6" />
                <stop offset={`${gradientStopPercent}%`} stopColor="#00BCD4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0097A7" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            
            {/* 填充区域 */}
            <path d={fillPath} fill="url(#tempGradient)" opacity="0.3" />
            
            {/* 过去曲线（虚线） */}
            {pastPath.path && (
              <path
                d={pastPath.path}
                fill="none"
                stroke="#FFC107"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="chart-line chart-line-past"
              />
            )}
            
            {/* 未来曲线（实线） */}
            {futurePath.path && (
              <path
                d={futurePath.path}
                fill="none"
                stroke="#00BCD4"
                strokeWidth="2"
                className="chart-line chart-line-future"
              />
            )}
            
            {/* 当前时间标记线 */}
            {currentPoint && (
              <line
                x1={currentPoint.x}
                y1={padding}
                x2={currentPoint.x}
                y2={300 - padding}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1"
                strokeDasharray="2 2"
                className="current-time-line"
              />
            )}
            
            {/* 当前时间圆点 */}
            {currentPoint && (
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="4"
                fill="#FFFFFF"
                stroke="#00BCD4"
                strokeWidth="2"
                className="current-time-dot"
              />
            )}
            
            {/* 最高温度标记 */}
            {maxPoint && (
              <g className="max-temp-marker">
                <circle cx={maxPoint.x} cy={maxPoint.y} r="5" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x={maxPoint.x} y={Math.max(18, maxPoint.y - 15)} textAnchor="middle" fill="#FF5722" fontSize="20" fontWeight="bold">
                  最高 {Math.round(maxTemp)}°
                </text>
              </g>
            )}
            
            {/* 最低温度标记 */}
            {minPoint && (
              <g className="min-temp-marker">
                <circle cx={minPoint.x} cy={minPoint.y} r="5" fill="#FF9800" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x={minPoint.x} y={Math.min(285, minPoint.y + 28)} textAnchor="middle" fill="#FF9800" fontSize="20" fontWeight="bold">
                  最低 {Math.round(minTemp)}°
                </text>
              </g>
            )}
            
            {/* 当前时间值标注 */}
            {currentPoint && (
              <g className="current-value-marker">
                <text 
                  x={currentPoint.x} 
                  y={Math.max(18, currentPoint.y - 15)} 
                  textAnchor="middle" 
                  fill="#FFFFFF" 
                  fontSize="22" 
                  fontWeight="bold"
                  className="current-value-label"
                >
                  {Math.round(currentPoint.value)}°
                </text>
              </g>
            )}
            
            {/* Y轴标签 */}
            <g className="chart-y-axis">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = range.min + (range.range * ratio);
                const y = 30 + (270 - 30) * (1 - ratio);
                return (
                  <text
                    key={ratio}
                    x="580"
                    y={y + 4}
                    textAnchor="end"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="16"
                    fontWeight="500"
                  >
                    {Math.round(value)}°
                  </text>
                );
              })}
            </g>
            
            {/* X轴标签 */}
            <g className="chart-x-axis">
              {[0, 6, 12, 18, 24].map((hour) => {
                const x = hour === 24 
                  ? 30 + ((23 / 23) * (600 - 30 * 2)) // 24时位置在最后一个点
                  : 30 + ((hour / 23) * (600 - 30 * 2));
                return (
                  <text
                    key={hour}
                    x={x}
                    y="290"
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="16"
                    fontWeight="500"
                  >
                    {hour}时
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="chart-legend">
          <span>最低 {Math.round(range.min)}°</span>
          <span>最高 {Math.round(range.max)}°</span>
        </div>
      </div>
    );
  };

  // 渲染其他图表（风速、UV、降水、湿度）
  const renderOtherChart = (key, label, unit = '') => {
    const pastPath = generatePath(key, true);
    const futurePath = generatePath(key, false);
    const fillPath = generateFillPath(key);
    const range = getValueRange(key);
    const { currentPoint } = pastPath;
    
    // 确保currentHourIndex在有效范围内
    const safeCurrentHourIndex = Math.max(0, Math.min(currentHourIndex, todayHours.length - 1));
    const gradientStopPercent = (safeCurrentHourIndex / 23) * 100;
    const currentValue = todayHours[safeCurrentHourIndex]?.[key] || 0;
    
    const padding = 30; // SVG内边距

    return (
      <div className="weather-chart">
        <div className="chart-wrapper">
          <svg width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" className="chart-svg">
            {/* 渐变定义 */}
            <defs>
              <linearGradient id={`${key}Gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC107" stopOpacity="0.6" />
                <stop offset={`${gradientStopPercent}%`} stopColor="#FF9800" stopOpacity="0.6" />
                <stop offset={`${gradientStopPercent}%`} stopColor="#00BCD4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0097A7" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            
            {/* 填充区域 */}
            <path d={fillPath} fill={`url(#${key}Gradient)`} opacity="0.3" />
            
            {/* 过去曲线（虚线） */}
            {pastPath.path && (
              <path
                d={pastPath.path}
                fill="none"
                stroke="#FFC107"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="chart-line chart-line-past"
              />
            )}
            
            {/* 未来曲线（实线） */}
            {futurePath.path && (
              <path
                d={futurePath.path}
                fill="none"
                stroke="#00BCD4"
                strokeWidth="2"
                className="chart-line chart-line-future"
              />
            )}
            
            {/* 当前时间标记线 */}
            {currentPoint && (
              <line
                x1={currentPoint.x}
                y1={padding}
                x2={currentPoint.x}
                y2={300 - padding}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1"
                strokeDasharray="2 2"
                className="current-time-line"
              />
            )}
            
            {/* 当前时间圆点 */}
            {currentPoint && (
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="4"
                fill="#FFFFFF"
                stroke="#00BCD4"
                strokeWidth="2"
                className="current-time-dot"
              />
            )}
            
            {/* 当前值显示 */}
            {currentPoint && (
              <text
                x={currentPoint.x}
                y={Math.max(18, currentPoint.y - 18)}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="22"
                fontWeight="bold"
                className="current-value-label"
              >
                {typeof currentValue === 'number' ? currentValue.toFixed(key === 'wind_m_s' ? 1 : 0) : currentValue}{unit}
              </text>
            )}
            
            {/* Y轴标签 */}
            <g className="chart-y-axis">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = range.min + (range.range * ratio);
                const y = 30 + (270 - 30) * (1 - ratio);
                return (
                  <text
                    key={ratio}
                    x="580"
                    y={y + 4}
                    textAnchor="end"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="16"
                    fontWeight="500"
                  >
                    {value.toFixed(key === 'wind_m_s' ? 1 : 0)}{unit}
                  </text>
                );
              })}
            </g>
            
            {/* X轴标签 */}
            <g className="chart-x-axis">
              {[0, 6, 12, 18, 24].map((hour) => {
                const x = hour === 24 
                  ? 30 + ((23 / 23) * (600 - 30 * 2)) // 24时位置在最后一个点
                  : 30 + ((hour / 23) * (600 - 30 * 2));
                return (
                  <text
                    key={hour}
                    x={x}
                    y="290"
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="16"
                    fontWeight="500"
                  >
                    {hour}时
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="chart-legend">
          <span>{label}</span>
        </div>
      </div>
    );
  };

  const renderWindChart = () => renderOtherChart('wind_m_s', '风速 (m/s)', '');
  const renderUVChart = () => renderOtherChart('uv_index', '紫外线指数', '');
  const renderPrecipitationChart = () => renderOtherChart('precip_prob', '降水概率 (%)', '%');
  const renderHumidityChart = () => renderOtherChart('relative_humidity', '湿度 (%)', '%');

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
        <h3>今天的天气数据</h3>
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
