import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecommendationCard from '../components/RecommendationCard';
import WeatherCard from '../components/WeatherCard';
import WeatherDetail from '../components/WeatherDetail';
import DailyForecast from '../components/DailyForecast';
import LocationSelector from '../components/LocationSelector';
import HealthAlerts from '../components/HealthAlerts';
import { useLocationContext } from '../contexts/LocationContext';
import './Home.css';

const Home = () => {
  const {
    currentLocation,
    locations,
    loading: locationLoading,
    getLocationByIP,
    getLocationByGeolocation,
    addLocation
  } = useLocationContext();

  const [isOutdoor, setIsOutdoor] = useState(true);
  const [activityLevel, setActivityLevel] = useState('low');
  const [recommendation, setRecommendation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // 首次打开时获取位置
  useEffect(() => {
    const initializeLocation = async () => {
      if (locationLoading) return;
      
      // 如果已有位置，不需要初始化
      if (currentLocation) {
        setInitializing(false);
        return;
      }

      try {
        // 检测是否为移动设备
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        let location;
        if (isMobile && navigator.geolocation) {
          // 移动设备：请求位置权限
          try {
            location = await getLocationByGeolocation();
          } catch (error) {
            console.warn('地理位置获取失败，尝试IP定位:', error);
            // 如果用户拒绝或失败，使用IP定位
            location = await getLocationByIP();
          }
        } else {
          // 浏览器：使用IP定位
          location = await getLocationByIP();
        }

        // 添加位置
        addLocation(location);
      } catch (error) {
        console.error('位置初始化失败:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationLoading, currentLocation]);

  // 获取天气数据
  const fetchWeatherData = async () => {
    if (!currentLocation) {
      return;
    }

    try {
      const res = await axios.get('/api/weather/forecast', {
        params: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timezone: currentLocation.timezone || 'Asia/Shanghai',
          days: 15
        }
      });
      setWeatherData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  // 计算推荐
  const calculateRecommendation = async () => {
    if (!currentLocation) {
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/recommendations/calculate', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timezone: currentLocation.timezone || 'Asia/Shanghai',
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

  // 当位置改变时获取天气数据
  useEffect(() => {
    if (currentLocation && !initializing) {
      fetchWeatherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, initializing]);

  // 当位置或参数改变时自动计算推荐
  useEffect(() => {
    if (currentLocation && !initializing) {
      calculateRecommendation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, isOutdoor, activityLevel, initializing]);

  if (initializing || locationLoading) {
    return (
      <div className="home container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="text-gray">正在获取位置信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <LocationSelector />

      {currentLocation && (
        <>
          <div className="settings-panel">
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

          {weatherData && (
            <>
              <WeatherCard weather={weatherData} location={currentLocation} />
              <WeatherDetail weatherData={weatherData} />
              <DailyForecast dailyData={weatherData.daily} />
            </>
          )}

          {recommendation && (
            <>
              <RecommendationCard recommendation={recommendation.recommendation} />
              {recommendation.recommendation.health_messages &&
                recommendation.recommendation.health_messages.length > 0 && (
                  <HealthAlerts messages={recommendation.recommendation.health_messages} />
                )}
            </>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
        </>
      )}

      {!currentLocation && !initializing && (
        <div className="empty-state">
          <p className="text-gray">无法获取位置信息</p>
          <p className="text-gray" style={{ fontSize: '14px', marginTop: '8px' }}>
            请检查位置权限设置或手动添加位置
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
