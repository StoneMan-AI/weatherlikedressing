import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getClothingIcon } from '../utils/clothingIconMap';
import './TravelRecommendation.css';

const TravelRecommendation = ({ currentLocation, weatherData, userProfile }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelRecommendation, setTravelRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastLocationId, setLastLocationId] = useState(null);

  // 设置默认日期范围（今天 到 今天+2天）
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(today.getDate() + 2);
      
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    }
  }, []);

  // 监听地区变化，清空已生成的旅行建议
  useEffect(() => {
    if (currentLocation) {
      const currentLocationId = currentLocation.id || `${currentLocation.latitude}_${currentLocation.longitude}`;
      
      // 如果地区发生了变化，清空旅行建议数据
      if (lastLocationId !== null && lastLocationId !== currentLocationId) {
        setTravelRecommendation(null);
        setError(null);
        // 重置日期为默认值
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);
        end.setDate(today.getDate() + 2);
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
      }
      
      setLastLocationId(currentLocationId);
    }
  }, [currentLocation, lastLocationId]);

  const formatDate = (date) => {
    // 使用本地时区，确保日期正确
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    // 获取本地时区的今天日期，确保时区正确
    const today = new Date();
    const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return formatDate(localDate);
  };

  const getMaxDate = () => {
    // 获取本地时区的今天日期，然后加15天
    const today = new Date();
    const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    localDate.setDate(localDate.getDate() + 15); // 最多15天后
    return formatDate(localDate);
  };

  // 验证日期是否有效（不能是过去的日期）
  const validateDate = (dateString, isStartDate = true) => {
    if (!dateString) return true; // 空值允许
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // 不能选择过去的日期
    if (selectedLocal < todayLocal) {
      return false;
    }
    
    // 不能超过15天
    const maxDate = new Date(todayLocal);
    maxDate.setDate(maxDate.getDate() + 15);
    if (selectedLocal > maxDate) {
      return false;
    }
    
    return true;
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleGenerateRecommendation = async () => {
    if (!startDate || !endDate) {
      setError('请选择旅行日期范围');
      return;
    }

    const days = calculateDays();
    if (days < 1) {
      setError('请选择有效的日期范围');
      return;
    }

    if (days > 15) {
      setError('旅行时间不能超过15天');
      return;
    }

    if (!currentLocation) {
      setError('请先选择地区');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/recommendations/travel', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timezone: currentLocation.timezone || 'Asia/Shanghai',
        start_date: startDate,
        end_date: endDate,
        user_profile: userProfile || {}
      });

      setTravelRecommendation(response.data.data);
    } catch (err) {
      console.error('Failed to generate travel recommendation:', err);
      setError(err.response?.data?.error || '生成旅行建议失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="travel-recommendation-section" className="travel-recommendation card">
      <div className="travel-header">
        <div className="travel-title-row">
          <h3>外出旅行穿衣建议</h3>
          {currentLocation && (
            <span className="travel-location-hint">({currentLocation.name})</span>
          )}
        </div>
        <p className="travel-subtitle">根据旅行日期和天气情况，为您提供个性化建议</p>
      </div>

      <div className="travel-date-selector">
        <div className="date-input-group">
          <label>出发日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              const newDate = e.target.value;
              if (validateDate(newDate, true)) {
                setStartDate(newDate);
                // 如果结束日期早于新的开始日期，自动调整结束日期
                if (endDate && newDate > endDate) {
                  const newEndDate = new Date(newDate);
                  newEndDate.setDate(newEndDate.getDate() + 2);
                  const maxDate = getMaxDate();
                  setEndDate(newEndDate.toISOString().split('T')[0] > maxDate ? maxDate : newEndDate.toISOString().split('T')[0]);
                }
              } else {
                // 如果日期无效，显示错误提示
                setError('出发日期不能是过去的日期，且不能是15天之后');
                // 恢复为今天
                setStartDate(getMinDate());
              }
            }}
            min={getMinDate()}
            max={getMaxDate()}
            className="date-input"
            required
          />
        </div>
        <div className="date-input-group">
          <label>返回日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              const newDate = e.target.value;
              if (validateDate(newDate, false)) {
                // 确保结束日期不早于开始日期
                if (startDate && newDate < startDate) {
                  setError('返回日期不能早于出发日期');
                  return;
                }
                setEndDate(newDate);
              } else {
                setError('返回日期不能是过去的日期，且不能是15天之后');
                // 恢复为开始日期+2天或今天+2天
                const baseDate = startDate || getMinDate();
                const newEndDate = new Date(baseDate);
                newEndDate.setDate(newEndDate.getDate() + 2);
                const maxDate = getMaxDate();
                setEndDate(newEndDate.toISOString().split('T')[0] > maxDate ? maxDate : newEndDate.toISOString().split('T')[0]);
              }
            }}
            min={startDate || getMinDate()}
            max={getMaxDate()}
            className="date-input"
            required
          />
        </div>
        <button
          className="btn-generate-travel"
          onClick={handleGenerateRecommendation}
          disabled={loading || !startDate || !endDate}
        >
          {loading ? '生成中...' : '生成建议'}
        </button>
      </div>

      {error && (
        <div className="travel-error">
          {error}
        </div>
      )}

      {travelRecommendation && (
        <div className="travel-results">
          <div className="travel-summary">
            <div className="summary-item">
              <span className="summary-label">旅行天数：</span>
              <span className="summary-value">{travelRecommendation.days}天</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">日期范围：</span>
              <span className="summary-value">
                {travelRecommendation.start_date} 至 {travelRecommendation.end_date}
              </span>
            </div>
          </div>

          {/* 穿衣建议 */}
          {travelRecommendation.clothing_recommendations && (
            <div className="recommendation-section">
              <h4 className="section-title">
                <span className="section-icon">👕</span>
                穿衣建议
              </h4>
              <div className="items-grid">
                {travelRecommendation.clothing_recommendations.map((item, index) => (
                  <ItemCard key={index} item={item} type="clothing" />
                ))}
              </div>
            </div>
          )}

          {/* 常备用品 */}
          {travelRecommendation.essential_items && travelRecommendation.essential_items.length > 0 && (
            <div className="recommendation-section">
              <h4 className="section-title">
                <span className="section-icon">🎒</span>
                常备用品
              </h4>
              <div className="items-grid">
                {travelRecommendation.essential_items.map((item, index) => (
                  <ItemCard key={index} item={item} type="essential" />
                ))}
              </div>
            </div>
          )}

          {/* 急需用品（非必须） */}
          {travelRecommendation.optional_items && travelRecommendation.optional_items.length > 0 && (
            <div className="recommendation-section">
              <h4 className="section-title">
                <span className="section-icon">📦</span>
                急需用品（非必须）
              </h4>
              <div className="items-grid">
                {travelRecommendation.optional_items.map((item, index) => (
                  <ItemCard key={index} item={item} type="optional" />
                ))}
              </div>
            </div>
          )}

          {/* 天气概况 */}
          {travelRecommendation.weather_summary && (
            <div className="weather-summary-section">
              <h4 className="section-title">
                <span className="section-icon">🌤️</span>
                天气概况
              </h4>
              {typeof travelRecommendation.weather_summary === 'object' ? (
                <>
                  {travelRecommendation.weather_summary.categories && travelRecommendation.weather_summary.categories.map((category, index) => (
                    <div key={index} className="weather-category">
                      <h5 className="category-title">{category.title}</h5>
                      <ul className="category-items">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {travelRecommendation.weather_summary.needs_plan_change && (
                    <div className="plan-change-alert">
                      <h5 className="alert-title">⚠️ 建议考虑调整出行计划</h5>
                      <ul className="alert-reasons">
                        {travelRecommendation.weather_summary.plan_change_reasons && travelRecommendation.weather_summary.plan_change_reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="weather-summary-content">
                  {travelRecommendation.weather_summary}
                </div>
              )}
            </div>
          )}

          {/* 特别提醒 */}
          {travelRecommendation.special_notes && travelRecommendation.special_notes.length > 0 && (
            <div className="special-notes-section">
              <h4 className="section-title">
                <span className="section-icon">⚠️</span>
                特别提醒
              </h4>
              <ul className="notes-list">
                {travelRecommendation.special_notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 物品卡片组件（带图标）
const ItemCard = ({ item, type }) => {
  const [imageError, setImageError] = useState(false);
  
  const itemName = typeof item === 'string' ? item : (item.name || item);
  const iconInfo = getClothingIcon(itemName, type);
  
  // 对于某些衣物类型，emoji可能不够准确，通过文字名称来明确区分
  // 例如：保暖内衣使用👕图标，但通过"保暖内衣"文字来明确表示
  const getIconNote = (itemName) => {
    // 对于没有专门emoji的衣物类型，添加说明
    if (itemName.includes('保暖内衣') || itemName.includes('羊毛打底') || itemName.includes('打底')) {
      return '（内衣）';
    }
    return '';
  };

  // 处理图片加载失败
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`item-card item-card-${type}`}>
      <div className="item-icon">
        {iconInfo.pngPath && !imageError ? (
          <img 
            src={iconInfo.pngPath} 
            alt={itemName}
            onError={handleImageError}
            className="clothing-icon-image"
          />
        ) : (
          <span className="clothing-icon-emoji">{iconInfo.emoji}</span>
        )}
      </div>
      <div className="item-name">
        {itemName}
        {getIconNote(itemName) && <span className="item-icon-note">{getIconNote(itemName)}</span>}
      </div>
      {typeof item === 'object' && item.reason && (
        <div className="item-reason">{item.reason}</div>
      )}
      {typeof item === 'object' && item.details && (
        <div className="item-details">{item.details}</div>
      )}
    </div>
  );
};

export default TravelRecommendation;

