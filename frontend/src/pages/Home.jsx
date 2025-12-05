import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import RecommendationCard from '../components/RecommendationCard';
import WeatherCard from '../components/WeatherCard';
import LocationSelector from '../components/LocationSelector';
import HealthAlerts from '../components/HealthAlerts';
import './Home.css';

const Home = () => {
  const [location, setLocation] = useState(null);
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [activityLevel, setActivityLevel] = useState('low');
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取用户地点列表
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await axios.get('/api/locations');
      return res.data.data;
    }
  });

  // 设置默认地点
  useEffect(() => {
    if (locationsData && locationsData.length > 0 && !location) {
      const defaultLocation = locationsData.find(loc => loc.is_default) || locationsData[0];
      setLocation(defaultLocation);
    }
  }, [locationsData, location]);

  // 计算推荐
  const calculateRecommendation = async () => {
    if (!location) {
      alert('请先选择地点');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/recommendations/calculate', {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone || 'Asia/Shanghai',
        is_outdoor: isOutdoor,
        activity_level: activityLevel
      });
      setRecommendation(res.data.data);
    } catch (error) {
      console.error('Failed to calculate recommendation:', error);
      alert('获取推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 当位置或参数改变时自动计算
  useEffect(() => {
    if (location) {
      calculateRecommendation();
    }
  }, [location, isOutdoor, activityLevel]);

  return (
    <div className="home container">
      <div className="home-header">
        <h1 className="text-xl">今日穿衣推荐</h1>
        <p className="text-gray">根据实时天气为您推荐最适合的穿搭</p>
      </div>

      <LocationSelector
        locations={locationsData || []}
        selectedLocation={location}
        onSelectLocation={setLocation}
      />

      {location && (
        <>
          <div className="settings-panel card">
            <h3>活动设置</h3>
            <div className="settings-row">
              <div className="setting-item">
                <label>活动场景</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="outdoor"
                      checked={isOutdoor}
                      onChange={() => setIsOutdoor(true)}
                    />
                    户外
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="indoor"
                      checked={!isOutdoor}
                      onChange={() => setIsOutdoor(false)}
                    />
                    室内
                  </label>
                </div>
              </div>
              <div className="setting-item">
                <label>活动强度</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="input"
                >
                  <option value="low">低（静坐/慢走）</option>
                  <option value="moderate">中（正常步行/轻运动）</option>
                  <option value="high">高（跑步/剧烈运动）</option>
                </select>
              </div>
            </div>
          </div>

          {recommendation && (
            <>
              <WeatherCard weather={recommendation.weather} />
              <RecommendationCard recommendation={recommendation.recommendation} />
              {recommendation.recommendation.health_messages &&
                recommendation.recommendation.health_messages.length > 0 && (
                  <HealthAlerts messages={recommendation.recommendation.health_messages} />
                )}
            </>
          )}

          {loading && (
            <div className="card text-center">
              <p>正在计算推荐...</p>
            </div>
          )}
        </>
      )}

      {!location && (
        <div className="card text-center">
          <p className="text-gray">请先添加一个地点</p>
          <a href="/settings" className="btn btn-primary mt-md">
            去设置
          </a>
        </div>
      )}
    </div>
  );
};

export default Home;
