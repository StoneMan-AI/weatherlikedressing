import React, { useState, useEffect } from 'react';
import './DailyForecast.css';

const DailyForecast = ({ dailyData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!dailyData || dailyData.length === 0) {
    return null;
  }

  // 移动端默认显示5天，PC端显示全部
  const defaultDisplayCount = isMobile ? 5 : 15;
  const displayCount = isExpanded || !isMobile ? dailyData.length : defaultDisplayCount;
  const shouldShowToggle = isMobile && dailyData.length > 5;

  // 判断是否是今天（使用时区正确的日期比较）
  const isToday = (dateString) => {
    if (!dateString) return false;
    
    try {
      // 提取日期部分（YYYY-MM-DD）
      const dayDateStr = dateString.split('T')[0];
      
      // 获取今天在本地时区的日期（YYYY-MM-DD格式）
      const today = new Date();
      const todayFormatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const todayDateStr = todayFormatter.format(today);
      
      // 直接比较日期字符串
      return dayDateStr === todayDateStr;
    } catch (error) {
      console.warn('Error comparing dates:', error);
      return false;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return { weekday: '', day: '' };
    }
    
    const date = new Date(dateString);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 如果是今天，返回"今天"
    if (isToday(dateString)) {
      return {
        weekday: '今天',
        day: date.getDate()
      };
    }
    
    // 否则返回星期
    const weekday = `星期${weekdays[date.getDay()]}`;
    
    return {
      weekday,
      day: date.getDate()
    };
  };

  const getWeatherIcon = (day) => {
    const precipProb = day.precipitation_probability_max || 0;
    const precipSum = day.precipitation_sum || 0;
    const uvIndex = day.uv_index_max || 0;
    
    // 根据降水概率和降水量判断
    if (precipProb > 50 || precipSum > 0.5) {
      return '🌧️';
    } else if (precipProb > 20 || uvIndex < 3) {
      // 降水概率较低或紫外线较弱，可能是多云
      return '☁️';
    } else {
      // 晴天
      return '☀️';
    }
  };

  // 计算所有天数的温度范围，用于温度条的可视化
  const allTemps = dailyData.map(d => ({
    min: d.temperature_min || 0,
    max: d.temperature_max || 0
  }));
  const globalMin = Math.min(...allTemps.map(t => t.min));
  const globalMax = Math.max(...allTemps.map(t => t.max));
  const tempRange = globalMax - globalMin || 1; // 避免除零

  const getTempBarColor = (minTemp, maxTemp) => {
    const avgTemp = (minTemp + maxTemp) / 2;
    if (avgTemp >= 25) {
      return 'linear-gradient(to right, #FFD700, #FF8C00)'; // 黄色到橙色
    } else if (avgTemp >= 20) {
      return 'linear-gradient(to right, #90EE90, #FFD700)'; // 绿色到黄色
    } else if (avgTemp >= 15) {
      return 'linear-gradient(to right, #87CEEB, #90EE90)'; // 天蓝色到绿色
    } else if (avgTemp >= 10) {
      return 'linear-gradient(to right, #4169E1, #87CEEB)'; // 蓝色到天蓝色
    } else {
      return 'linear-gradient(to right, #1E90FF, #4169E1)'; // 深蓝到蓝色
    }
  };

  const calculateBarWidth = (minTemp, maxTemp) => {
    const startPercent = ((minTemp - globalMin) / tempRange) * 100;
    const endPercent = ((maxTemp - globalMin) / tempRange) * 100;
    return {
      left: Math.max(0, startPercent),
      width: Math.max(2, endPercent - startPercent) // 至少2%宽度
    };
  };

  return (
    <div className="daily-forecast">
      <div className="forecast-header">
        <h3>15天预报</h3>
        {shouldShowToggle && (
          <button
            className="btn-toggle-forecast"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '展开全部'}
          </button>
        )}
      </div>

      <div className="forecast-list">
        {dailyData.slice(0, displayCount).map((day, index) => {
          // 使用实际的日期字段（可能是date或time）
          const dateString = day.date || day.time || day.timestamp;
          const dateInfo = formatDate(dateString);
          const minTemp = Math.round(day.temperature_min || 0);
          const maxTemp = Math.round(day.temperature_max || 0);
          const barStyle = calculateBarWidth(minTemp, maxTemp);
          
          return (
            <div key={index} className="forecast-row">
              <div className="row-weekday">{dateInfo.weekday}</div>
              <div className="row-weather-icon">{getWeatherIcon(day)}</div>
              <div className="row-temp-low">{minTemp}°</div>
              <div className="row-temp-bar-container">
                <div 
                  className="row-temp-bar"
                  style={{
                    left: `${barStyle.left}%`,
                    width: `${barStyle.width}%`,
                    background: getTempBarColor(minTemp, maxTemp)
                  }}
                />
              </div>
              <div className="row-temp-high">{maxTemp}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyForecast;

