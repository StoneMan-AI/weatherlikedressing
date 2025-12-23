import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TravelRecommendation.css';

const TravelRecommendation = ({ currentLocation, weatherData, userProfile }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelRecommendation, setTravelRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 设置默认日期范围（今天+2天 到 今天+4天）
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 2);
      const end = new Date(today);
      end.setDate(today.getDate() + 4);
      
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    }
  }, []);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 2); // 至少2天后
    return formatDate(today);
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 15); // 最多15天后
    return formatDate(today);
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
    if (days < 2) {
      setError('旅行时间至少需要2天');
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
    <div className="travel-recommendation card">
      <div className="travel-header">
        <h3>外出旅行穿衣建议</h3>
        <p className="travel-subtitle">根据旅行日期和天气情况，为您提供个性化建议</p>
      </div>

      <div className="travel-date-selector">
        <div className="date-input-group">
          <label>出发日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label>返回日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || getMinDate()}
            max={getMaxDate()}
            className="date-input"
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
  const getItemIcon = (itemName) => {
    const iconMap = {
      // 衣物类 - 上装
      '短袖': '👕', 'T恤': '👕', '长袖': '👔', '薄长袖': '👔', '衬衫': '👔',
      '毛衣': '🧥', '轻毛衣': '🧥', '针织衫': '🧥', '卫衣': '👕',
      '夹克': '🧥', '薄羽绒': '🧥', '羽绒服': '🧥', '厚羽绒': '🧥', '中厚羽绒服': '🧥',
      '保暖内衣': '👕', '羊毛打底': '👕', '羊毛衫': '🧥', '抓绒': '🧥',
      '软壳': '🧥', '羽绒外套': '🧥', '羽绒马甲': '🧥', '马甲': '🧥',
      '风衣': '🧥', '大衣': '🧥', '冲锋衣': '🧥', '运动服': '👕',
      
      // 衣物类 - 下装
      '短裤': '🩳', '长裤': '👖', '牛仔裤': '👖', '运动裤': '👖',
      '打底裤': '👖', '休闲裤': '👖', '裙子': '👗', '连衣裙': '👗',
      
      // 衣物类 - 鞋袜
      '保暖袜': '🧦', '袜子': '🧦', '运动袜': '🧦',
      '运动鞋': '👟', '休闲鞋': '👟', '靴子': '👢', '防滑鞋': '👢',
      '凉鞋': '👡', '拖鞋': '🩴', '雨鞋': '👢',
      
      // 配饰类 - 头部
      '围巾': '🧣', '薄围巾': '🧣', '厚围巾': '🧣', '丝巾': '🧣',
      '手套': '🧤', '帽子': '🧢', '保暖帽': '🧢', '毛线帽': '🧢',
      '遮阳帽': '👒', '棒球帽': '🧢', '太阳镜': '🕶️', '墨镜': '🕶️',
      '口罩': '😷', '面罩': '😷',
      
      // 雨具类
      '雨具': '☂️', '雨伞': '☂️', '雨衣': '🧥', '雨披': '🧥',
      '雨鞋套': '👢', '防水包': '🎒',
      
      // 常备用品 - 证件
      '身份证': '🆔', '护照': '🛂', '驾驶证': '🆔', '学生证': '🆔',
      
      // 常备用品 - 电子设备
      '充电宝': '🔋', '充电器': '🔌', '数据线': '🔌', '耳机': '🎧',
      '相机': '📷', '手机': '📱', '平板': '📱',
      
      // 常备用品 - 护理用品
      '防晒霜': '🧴', '润唇膏': '💄', '湿巾': '🧻', '纸巾': '🧻',
      '洗手液': '🧴', '免洗洗手液': '🧴', '消毒湿巾': '🧻',
      '护肤品': '🧴', '洗面奶': '🧴', '面霜': '🧴',
      
      // 常备用品 - 药品
      '常用药品': '💊', '创可贴': '🩹', '感冒药': '💊', '退烧药': '💊',
      '止痛药': '💊', '肠胃药': '💊', '过敏药': '💊', '晕车药': '💊',
      '药箱': '💊', '体温计': '🌡️',
      
      // 常备用品 - 其他
      '水杯': '🥤', '保温杯': '☕', '保温瓶': '☕', '水壶': '🥤',
      '零食': '🍫', '巧克力': '🍫', '饼干': '🍪',
      '地图': '🗺️', '指南针': '🧭', '手电筒': '🔦',
      
      // 急需用品 - 保暖
      '暖宝宝': '🔥', '热水袋': '🔥', '暖手宝': '🔥', '暖贴': '🔥',
      '电热毯': '🔥', '毛毯': '🛏️', '睡袋': '🛏️',
      
      // 急需用品 - 防虫
      '防蚊液': '🦟', '驱虫剂': '🦟', '蚊香': '🦟', '驱蚊贴': '🦟',
      
      // 急需用品 - 应急
      '急救包': '🏥', '急救箱': '🏥', '绷带': '🩹', '碘伏': '🧴',
      '多功能刀': '🔪', '打火机': '🔥', '火柴': '🔥',
      
      // 急需用品 - 其他
      '便携式洗衣液': '🧴', '洗衣粉': '🧴', '晾衣架': '🪝',
      '小风扇': '🌀', '扇子': '🌀', '冰袋': '🧊',
      '护膝': '🦵', '护腰': '🦴', '护腕': '🦴',
      '儿童玩具': '🧸', '儿童零食': '🍭', '安抚奶嘴': '🍼',
    };

    // 尝试匹配关键词
    for (const [key, icon] of Object.entries(iconMap)) {
      if (itemName.includes(key)) {
        return icon;
      }
    }

    // 默认图标
    return type === 'clothing' ? '👕' : type === 'essential' ? '🎒' : '📦';
  };

  const icon = typeof item === 'string' ? getItemIcon(item) : getItemIcon(item.name || item);
  const name = typeof item === 'string' ? item : (item.name || item);

  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = typeof item === 'object' && (item.reason || item.details);

  return (
    <div 
      className={`item-card item-card-${type} ${hasDetails ? 'has-details' : ''}`}
      onClick={() => hasDetails && setShowDetails(!showDetails)}
    >
      <div className="item-icon">{icon}</div>
      <div className="item-name">{name}</div>
      {typeof item === 'object' && item.reason && (
        <div className="item-reason">{item.reason}</div>
      )}
      {typeof item === 'object' && item.details && showDetails && (
        <div className="item-details">{item.details}</div>
      )}
      {hasDetails && (
        <div className="item-details-toggle">
          {showDetails ? '收起详情' : '查看详情'}
        </div>
      )}
    </div>
  );
};

export default TravelRecommendation;

