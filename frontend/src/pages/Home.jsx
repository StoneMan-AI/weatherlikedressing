import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RecommendationCard from '../components/RecommendationCard';
import WeatherCard from '../components/WeatherCard';
import WeatherDetail from '../components/WeatherDetail';
import DailyForecast from '../components/DailyForecast';
import LocationSelector from '../components/LocationSelector';
import HealthAlerts from '../components/HealthAlerts';
import CustomSelect from '../components/CustomSelect';
import TravelRecommendation from '../components/TravelRecommendation';
import { useLocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { recalculateRecommendation, canUseLocalCalculation } from '../utils/recommendationCalculator';
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
  
  const { user } = useAuth();

  const [isOutdoor, setIsOutdoor] = useState(true);
  const [activityLevel, setActivityLevel] = useState('low');
  const [recommendation, setRecommendation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
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

  // 计算推荐（带重试机制）- 优化：只更新推荐，不重新获取天气数据
  const calculateRecommendation = async (retryCount = 0, skipLoading = false) => {
    if (!currentLocation) {
      return;
    }

    const maxRetries = 2;
    // 只有在首次调用时才显示 loading（切换活动场景/强度时不显示全屏 loading）
    if (!skipLoading) {
      setRecommendationLoading(true);
    }
    
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
      
      const errorData = error.response?.data;
      const isRetryable = errorData?.retryable !== false;
      const shouldRetry = retryCount < maxRetries && isRetryable;
      
      if (shouldRetry) {
        // 指数退避重试：1秒、2秒
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying recommendation calculation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          calculateRecommendation(retryCount + 1, skipLoading);
        }, delay);
        return; // 不设置loading为false，保持加载状态
      } else {
        // 重试次数用完或错误不可重试，显示错误信息
        const errorMessage = errorData?.error || error.message || '获取推荐失败，请稍后重试';
        console.error('Recommendation calculation failed after retries:', errorMessage);
        
        // 只在最后一次失败时显示错误提示
        if (retryCount === 0 || !isRetryable) {
          // 可以显示更友好的错误提示，而不是alert
          // 这里暂时保留alert，但可以后续改为Toast组件
          alert(errorMessage);
        }
      }
    } finally {
      // 只在非重试情况下设置loading为false
      if (retryCount === 0 || retryCount >= maxRetries) {
        setRecommendationLoading(false);
      }
    }
  };

  // 使用 useRef 跟踪是否是首次加载
  const isFirstLoadRef = useRef(true);

  // 当位置改变时获取天气数据（只在位置变化时调用，不依赖活动场景/强度）
  useEffect(() => {
    if (currentLocation && !initializing) {
      fetchWeatherData();
      isFirstLoadRef.current = true; // 位置变化时重置首次加载标志
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, initializing]);

  // 当位置改变时计算推荐（首次加载）
  useEffect(() => {
    if (!currentLocation || initializing) {
      return;
    }

    const isFirstLoad = isFirstLoadRef.current;
    
    // 如果是首次加载（位置变化），显示全屏 loading 并请求后端
    if (isFirstLoad) {
      setLoading(true);
      calculateRecommendation(0, false).finally(() => {
        setLoading(false);
        isFirstLoadRef.current = false; // 标记首次加载完成
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, initializing]);

  // 当活动场景或活动强度改变时，使用本地计算（不请求后端）
  useEffect(() => {
    if (!currentLocation || initializing || isFirstLoadRef.current) {
      return; // 首次加载时跳过，由上面的 useEffect 处理
    }

    // 检查是否可以使用本地计算
    if (canUseLocalCalculation(weatherData, recommendation?.recommendation)) {
      try {
        // 使用本地计算重新生成推荐
        const recalculated = recalculateRecommendation(
          recommendation.recommendation,
          weatherData,
          isOutdoor,
          activityLevel,
          {} // userProfile，如果需要可以从用户上下文获取
        );

        // 更新推荐结果
        setRecommendation({
          ...recommendation,
          recommendation: recalculated
        });
      } catch (error) {
        console.error('Local calculation failed, falling back to API:', error);
        // 如果本地计算失败，回退到API请求
        calculateRecommendation(0, true);
      }
    } else {
      // 如果没有完整数据，回退到API请求
      calculateRecommendation(0, true);
    }
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
          {weatherData && (
            <>
              <WeatherCard weather={weatherData} location={currentLocation} />
              <WeatherDetail weatherData={weatherData} timezone={currentLocation.timezone || 'Asia/Shanghai'} />
              <DailyForecast dailyData={weatherData.daily} />
            </>
          )}

          {recommendationLoading && !loading && (
            <div className="recommendation-loading">
              <div className="loading-spinner"></div>
              <p className="text-gray" style={{ marginTop: '8px', fontSize: '14px' }}>正在更新推荐...</p>
            </div>
          )}

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
                <CustomSelect
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  options={[
                    { value: 'low', label: '低（静坐/慢走）' },
                    { value: 'moderate', label: '中（正常步行/轻运动）' },
                    { value: 'high', label: '高（跑步/剧烈运动）' }
                  ]}
                />
              </div>
            </div>
          </div>

          {recommendation && (
            <>
              <RecommendationCard recommendation={recommendation.recommendation} />
              {recommendation.recommendation.health_messages &&
                recommendation.recommendation.health_messages.length > 0 && (
                  <HealthAlerts messages={recommendation.recommendation.health_messages} />
                )}
            </>
          )}

          {weatherData && (
            <TravelRecommendation 
              currentLocation={currentLocation}
              weatherData={weatherData}
              userProfile={userProfile}
            />
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
