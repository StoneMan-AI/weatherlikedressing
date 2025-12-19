import React, { useState } from 'react';
import './DailyForecast.css';

const DailyForecast = ({ dailyData }) => {
  const [selectedDay, setSelectedDay] = useState(0);

  if (!dailyData || dailyData.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return {
      month,
      day,
      weekday,
      fullDate: `${date.getFullYear()}年${month}月${day}日 星期${weekday}`
    };
  };

  const getTodayDate = () => {
    const today = new Date();
    return {
      month: today.getMonth() + 1,
      day: today.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][today.getDay()],
      fullDate: `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`
    };
  };

  const today = getTodayDate();

  return (
    <div className="daily-forecast">
      <div className="forecast-header">
        <h3>15天预报</h3>
        <div className="selected-date">
          {selectedDay === 0 ? today.fullDate : formatDate(dailyData[selectedDay]?.date).fullDate}
        </div>
      </div>

      <div className="date-selector">
        {dailyData.slice(0, 7).map((day, index) => {
          const dateInfo = index === 0 ? today : formatDate(day.date);
          const isSelected = selectedDay === index;
          
          return (
            <div
              key={index}
              className={`date-item ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedDay(index)}
            >
              <div className="date-weekday">{index === 0 ? '今天' : `星期${dateInfo.weekday}`}</div>
              <div className="date-number">{dateInfo.day}</div>
            </div>
          );
        })}
      </div>

      {dailyData[selectedDay] && (
        <div className="day-details">
          <div className="temperature-range">
            <span className="temp-high">最高 {Math.round(dailyData[selectedDay].temperature_max)}°</span>
            <span className="temp-low">最低 {Math.round(dailyData[selectedDay].temperature_min)}°</span>
          </div>
          
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">降水概率</span>
              <span className="detail-value">{dailyData[selectedDay].precipitation_probability_max || 0}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">降水量</span>
              <span className="detail-value">{dailyData[selectedDay].precipitation_sum?.toFixed(1) || 0}mm</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">风速</span>
              <span className="detail-value">{dailyData[selectedDay].wind_speed_max?.toFixed(1) || 0} m/s</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">紫外线</span>
              <span className="detail-value">{Math.round(dailyData[selectedDay].uv_index_max || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyForecast;

