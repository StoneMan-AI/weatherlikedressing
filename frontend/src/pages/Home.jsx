import React, { useState, useEffect, useRef } from 'react';
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
  const [error, setError] = useState(null);
  
  // 用于取消请求的AbortController
  const abortControllerRef = useRef(null);

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
  const fetchWeatherData = async (signal) => {
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
        },
        signal // 支持请求取消
      });
      
      // 验证数据完整性
      if (res.data.success && res.data.data && res.data.data.current) {
        setWeatherData(res.data.data);
        setError(null);
      } else {
        throw new Error('天气数据格式不正确');
      }
    } catch (error) {
      // 如果是取消请求，不显示错误
      if (axios.isCancel(error) || error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch weather data:', error);
      setError('获取天气数据失败，请稍后重试');
    }
  };

  // 计算推荐
  const calculateRecommendation = async (signal) => {
    if (!currentLocation) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/api/recommendations/calculate', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timezone: currentLocation.timezone || 'Asia/Shanghai',
        is_outdoor: isOutdoor,
        activity_level: activityLevel
      }, {
        signal // 支持请求取消
      });
      
      // 验证响应数据
      if (res.data.success && res.data.data && res.data.data.recommendation) {
        setRecommendation(res.data.data);
        setError(null);
      } else {
        throw new Error('推荐数据格式不正确');
      }
    } catch (error) {
      // 如果是取消请求，不显示错误
      if (axios.isCancel(error) || error.name === 'AbortError') {
        return;
      }
      
      console.error('Failed to calculate recommendation:', error);
      const errorMessage = error.response?.data?.error || error.message || '获取推荐失败，请稍后重试';
      setError(errorMessage);
      
      // 只在非取消错误时显示提示
      if (!axios.isCancel(error) && error.name !== 'AbortError') {
        // 延迟显示错误，避免快速切换时的闪烁
        setTimeout(() => {
          if (errorMessage) {
            alert(errorMessage);
          }
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  // 当位置改变时获取天气数据和推荐
  useEffect(() => {
    if (!currentLocation || initializing) {
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 重置状态
    setError(null);
    setWeatherData(null);
    setRecommendation(null);

    // 获取天气数据
    fetchWeatherData(abortController.signal);

    // 计算推荐
    calculateRecommendation(abortController.signal);

    // 清理函数：组件卸载或位置改变时取消请求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, initializing]);

  // 当活动参数改变时重新计算推荐（不改变位置）
  useEffect(() => {
    if (!currentLocation || initializing) {
      return;
    }

    // 取消之前的推荐请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    calculateRecommendation(abortController.signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOutdoor, activityLevel]);

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

          {error && (
            <div className="error-message" style={{
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--text-primary)',
              textAlign: 'center'
            }}>
              <p>{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  if (currentLocation) {
                    const abortController = new AbortController();
                    abortControllerRef.current = abortController;
                    calculateRecommendation(abortController.signal);
                  }
                }}
                className="btn btn-primary"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                重试
              </button>
            </div>
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
