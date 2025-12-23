import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    // 允许从今天开始选择
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
    // 使用数组，按从具体到一般的顺序排列，优先匹配更长的关键词
    const iconMap = [
      // 衣物类 - 上装（从具体到一般）
      ['中厚羽绒服', '🧥'], ['厚羽绒', '🧥'], ['薄羽绒', '🧥'], ['羽绒服', '🧥'], ['羽绒外套', '🧥'], ['羽绒马甲', '🧥'],
      ['保暖内衣', '👕'], ['羊毛打底', '👕'], ['羊毛衫', '🧥'],
      ['薄长袖', '👔'], ['长袖', '👔'], ['短袖', '👕'], ['T恤', '👕'],
      ['轻毛衣', '🧥'], ['毛衣', '🧥'], ['针织衫', '🧥'],
      ['冲锋衣', '🧥'], ['软壳', '🧥'], ['抓绒', '🧥'],
      ['风衣', '🧥'], ['大衣', '🧥'], ['夹克', '🧥'], ['马甲', '🧥'],
      ['卫衣', '👕'], ['运动服', '👕'], ['衬衫', '👔'],
      
      // 衣物类 - 下装
      ['连衣裙', '👗'], ['裙子', '👗'],
      ['打底裤', '👖'], ['牛仔裤', '👖'], ['运动裤', '👖'], ['休闲裤', '👖'],
      ['长裤', '👖'], ['短裤', '🩳'],
      
      // 衣物类 - 鞋袜
      ['雨鞋', '👢'], ['防滑鞋', '👢'], ['靴子', '👢'],
      ['运动鞋', '👟'], ['休闲鞋', '👟'],
      ['凉鞋', '👡'], ['拖鞋', '🩴'],
      ['保暖袜', '🧦'], ['运动袜', '🧦'], ['袜子', '🧦'],
      
      // 配饰类 - 头部
      ['毛线帽', '🧢'], ['保暖帽', '🧢'], ['遮阳帽', '👒'], ['棒球帽', '🧢'], ['帽子', '🧢'],
      ['太阳镜', '🕶️'], ['墨镜', '🕶️'],
      ['厚围巾', '🧣'], ['薄围巾', '🧣'], ['丝巾', '🧣'], ['围巾', '🧣'],
      ['手套', '🧤'],
      ['口罩', '😷'], ['面罩', '😷'],
      
      // 雨具类（优先匹配具体物品）
      ['雨鞋套', '👢'], ['雨披', '🧥'], ['雨衣', '🧥'], ['雨伞', '☂️'], ['雨具', '☂️'],
      ['防水包', '🎒'],
      
      // 常备用品 - 证件
      ['学生证', '🆔'], ['驾驶证', '🆔'], ['身份证', '🆔'], ['护照', '🛂'],
      
      // 常备用品 - 电子设备
      ['数据线', '🔌'], ['充电器', '🔌'], ['充电宝', '🔋'],
      ['耳机', '🎧'], ['相机', '📷'], ['手机', '📱'], ['平板', '📱'],
      
      // 常备用品 - 护理用品
      ['免洗洗手液', '🧴'], ['洗手液', '🧴'],
      ['消毒湿巾', '🧻'], ['湿巾', '🧻'], ['纸巾', '🧻'],
      ['防晒霜', '🧴'], ['润唇膏', '💄'],
      ['面霜', '🧴'], ['洗面奶', '🧴'], ['护肤品', '🧴'],
      
      // 常备用品 - 药品
      ['体温计', '🌡️'], ['药箱', '💊'],
      ['晕车药', '💊'], ['过敏药', '💊'], ['肠胃药', '💊'], ['止痛药', '💊'],
      ['退烧药', '💊'], ['感冒药', '💊'], ['常用药品', '💊'],
      ['创可贴', '🩹'],
      
      // 常备用品 - 其他
      ['保温瓶', '☕'], ['保温杯', '☕'], ['水壶', '🥤'], ['水杯', '🥤'],
      ['饼干', '🍪'], ['巧克力', '🍫'], ['零食', '🍫'],
      ['手电筒', '🔦'], ['指南针', '🧭'], ['地图', '🗺️'],
      
      // 急需用品 - 保暖
      ['电热毯', '🔥'], ['睡袋', '🛏️'], ['毛毯', '🛏️'],
      ['暖贴', '🔥'], ['暖手宝', '🔥'], ['热水袋', '🔥'], ['暖宝宝', '🔥'],
      
      // 急需用品 - 防虫
      ['驱蚊贴', '🦟'], ['蚊香', '🦟'], ['驱虫剂', '🦟'], ['防蚊液', '🦟'],
      
      // 急需用品 - 应急
      ['急救箱', '🏥'], ['急救包', '🏥'],
      ['碘伏', '🧴'], ['绷带', '🩹'],
      ['多功能刀', '🔪'], ['火柴', '🔥'], ['打火机', '🔥'],
      
      // 急需用品 - 其他
      ['晾衣架', '🪝'], ['便携式洗衣液', '🧴'], ['洗衣粉', '🧴'],
      ['冰袋', '🧊'], ['扇子', '🌀'], ['小风扇', '🌀'],
      ['护腕', '🦴'], ['护腰', '🦴'], ['护膝', '🦵'],
      ['安抚奶嘴', '🍼'], ['儿童零食', '🍭'], ['儿童玩具', '🧸'],
      
      // 特殊建议
      ['紧急保暖包', '🔥'], ['多层穿搭', '👕'],
    ];

    // 按长度从长到短排序，优先匹配更具体的关键词
    iconMap.sort((a, b) => b[0].length - a[0].length);

    // 尝试匹配关键词（优先匹配更长的）
    for (const [key, icon] of iconMap) {
      if (itemName.includes(key)) {
        return icon;
      }
    }

    // 默认图标
    return type === 'clothing' ? '👕' : type === 'essential' ? '🎒' : '📦';
  };

  const icon = typeof item === 'string' ? getItemIcon(item) : getItemIcon(item.name || item);
  const name = typeof item === 'string' ? item : (item.name || item);

  return (
    <div className={`item-card item-card-${type}`}>
      <div className="item-icon">{icon}</div>
      <div className="item-name">{name}</div>
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

