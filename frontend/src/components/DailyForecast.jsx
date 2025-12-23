import React from 'react';
import './DailyForecast.css';

const DailyForecast = ({ dailyData }) => {
  if (!dailyData || dailyData.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    
    return {
      weekday,
      day: date.getDate()
    };
  };

  const getTodayDate = () => {
    const today = new Date();
    return {
      weekday: '今天',
      day: today.getDate()
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
      </div>

      <div className="forecast-list">
        {dailyData.slice(0, 15).map((day, index) => {
          const dateInfo = index === 0 ? getTodayDate() : formatDate(day.date);
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

