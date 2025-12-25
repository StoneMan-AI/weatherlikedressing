import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RecommendationCard from '../components/RecommendationCard';
import WeatherCard from '../components/WeatherCard';
import WeatherDetail from '../components/WeatherDetail';
import DailyForecast from '../components/DailyForecast';
import LocationSelector from '../components/LocationSelector';
import HealthAlerts from '../components/HealthAlerts';
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
    addLocation,
    getDefaultLocation
  } = useLocationContext();
  
  const { user } = useAuth();
  const userProfile = user?.profile_json || {};

  const [isOutdoor, setIsOutdoor] = useState(true);
  const [activityLevel, setActivityLevel] = useState('low');
  const [recommendation, setRecommendation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isViewingTomorrow, setIsViewingTomorrow] = useState(false);
  
  // 使用 ref 跟踪初始化状态，避免重复执行
  const initializationRef = useRef({ initialized: false });
  
  // 使用 ref 跟踪上一次的用户画像，用于检测是否真的发生了变化
  const previousUserProfileRef = useRef(null);

  // 首次打开时获取位置（仅使用IP定位）
  useEffect(() => {
    // 如果已经初始化过，不再执行
    if (initializationRef.current.initialized) {
      return;
    }

    // 如果已有位置，标记为已初始化（说明从存储中加载了位置数据）
    if (currentLocation) {
      initializationRef.current.initialized = true;
      setInitializing(false);
      return;
    }

    // 如果正在加载位置数据，等待
    if (locationLoading) {
      return;
    }

    // 如果位置列表不为空，说明已经从存储中加载了数据，不需要再次初始化
    if (locations.length > 0) {
      initializationRef.current.initialized = true;
      setInitializing(false);
      return;
    }

    const initializeLocation = async () => {
      try {
        // 尝试IP定位
        let location;
        try {
          location = await getLocationByIP();
          initializationRef.current.initialized = true;
        } catch (ipError) {
          // IP定位失败，使用默认位置（北京）
          location = getDefaultLocation();
          initializationRef.current.initialized = true;
        }

        // 添加位置（这会保存到存储中）
        if (location) {
          addLocation(location);
        }
      } catch (error) {
        console.error('位置初始化失败:', error);
        // 如果所有定位方式都失败，使用默认位置（北京）
        try {
          const defaultLocation = getDefaultLocation();
          initializationRef.current.initialized = true;
          addLocation(defaultLocation);
        } catch (defaultError) {
          console.error('设置默认位置失败:', defaultError);
        }
      } finally {
        setInitializing(false);
      }
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationLoading, locations.length, currentLocation]); // 添加 locations.length 和 currentLocation 作为依赖项

  // 获取天气数据
  const fetchWeatherData = async () => {
    if (!currentLocation) {
      return null;
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
      return res.data.data; // 返回天气数据
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  };

  // 刷新页面数据
  const handleRefresh = async () => {
    if (!currentLocation) {
      return;
    }

    // 重置状态
    setLoading(true);
    setRecommendationLoading(true);
    setRecommendation(null);
    setWeatherData(null);
    isFirstLoadRef.current = true;

    try {
      // 重新获取天气数据
      const newWeatherData = await fetchWeatherData();
      
      if (newWeatherData) {
        // 如果天气数据获取成功，重新计算推荐
        await calculateRecommendation(0, false, null);
      } else {
        // 如果天气数据获取失败，也尝试重新计算（可能会使用缓存或失败）
        await calculateRecommendation(0, false, null);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
      setRecommendationLoading(false);
    }
  };

  // 计算推荐（带重试机制）- 优化：只更新推荐，不重新获取天气数据
  const calculateRecommendation = async (retryCount = 0, skipLoading = false, targetTime = null, forceOutdoor = false) => {
    if (!currentLocation) {
      return;
    }

    const maxRetries = 2;
    // 只有在首次调用时才显示 loading（切换活动场景/强度时不显示全屏 loading）
    if (!skipLoading) {
      setRecommendationLoading(true);
    }
    
    try {
      const timezone = currentLocation.timezone || 'Asia/Shanghai';
      
      // 如果没有指定目标时间，使用当前时间
      let finalTargetTime = targetTime;
      if (!finalTargetTime) {
        // 获取当前时间在指定时区的 ISO 字符串
        const now = new Date();
        finalTargetTime = now.toISOString();
      }
      
      // 如果 forceOutdoor 为 true，强制使用户外模式；否则使用用户选择的活动场景
      const finalIsOutdoor = forceOutdoor ? true : isOutdoor;
      
      const requestBody = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timezone: timezone,
        is_outdoor: finalIsOutdoor, // 使用用户选择的活动场景（户外/室内）
        activity_level: activityLevel,
        user_profile: userProfile, // 传递用户画像数据以生成个性化建议
        target_time: finalTargetTime // 使用当前时间或指定的目标时间
      };
      
      const res = await axios.post('/api/recommendations/calculate', requestBody);
      
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

  // 获取明天的穿衣建议
  const handleViewTomorrow = async () => {
    if (!currentLocation || !weatherData) {
      return;
    }

    try {
      setRecommendationLoading(true);
      
      const timezone = currentLocation.timezone || 'Asia/Shanghai';
      
      // 获取当前时间
      const now = new Date();
      
      // 获取明天在指定时区的日期字符串（YYYY-MM-DD格式）
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const tomorrowDateStr = dateFormatter.format(tomorrow);
      
      // 调用API获取明天的推荐（使用明天全天天气概况数据）
      // "看明天"功能使用户外模式，因为通常是外出场景
      const res = await axios.post('/api/recommendations/calculate', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timezone: timezone,
        is_outdoor: true, // "看明天"使用户外模式，计算阳光分数
        activity_level: activityLevel,
        user_profile: userProfile,
        target_date: tomorrowDateStr // 使用明天的日期，后端会使用全天天气概况数据（格式：YYYY-MM-DD）
      });
      
      setRecommendation(res.data.data);
      setIsViewingTomorrow(true);
    } catch (error) {
      console.error('Failed to fetch tomorrow recommendation:', error);
      alert('获取明天的穿衣建议失败，请稍后重试');
    } finally {
      setRecommendationLoading(false);
    }
  };

  // 查看今天的穿衣建议
  const handleViewToday = async () => {
    setIsViewingTomorrow(false);
    // 重新计算今天的推荐
    await calculateRecommendation(0, false, null);
  };

  // 使用 useRef 跟踪是否是首次加载和上一个位置ID
  const isFirstLoadRef = useRef(true);
  const lastLocationIdRef = useRef(null);
  const locationChangedRef = useRef(false); // 标记位置是否变化

  // 当位置改变时，立即清空旧的推荐数据和重置状态
  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    const currentLocationId = currentLocation.id || `${currentLocation.latitude}_${currentLocation.longitude}`;
    
    // 如果位置发生了变化，清空旧的推荐数据并强制重新计算
    if (lastLocationIdRef.current !== null && lastLocationIdRef.current !== currentLocationId) {
      console.log('Location changed, clearing old recommendation data');
      setRecommendation(null); // 清空旧的推荐数据
      setWeatherData(null); // 清空旧的天气数据
      setIsViewingTomorrow(false); // 重置"看明天"状态
      isFirstLoadRef.current = true; // 重置首次加载标志，确保会重新计算推荐
      // 清除 profileChanged 标记，因为位置变化时应该重新计算，不受此标记影响
      localStorage.removeItem('profileChanged');
      // 标记位置已变化
      locationChangedRef.current = true;
    } else {
      // 位置没变化，清除标记
      locationChangedRef.current = false;
    }
    
    lastLocationIdRef.current = currentLocationId;
  }, [currentLocation]);

  // 当位置改变时获取天气数据（只在位置变化时调用，不依赖活动场景/强度）
  useEffect(() => {
    if (!currentLocation || initializing) {
      return;
    }

    // 检查位置是否真的变化了（通过比较位置ID和变化标记）
    const currentLocationId = currentLocation.id || `${currentLocation.latitude}_${currentLocation.longitude}`;
    const lastLocationId = lastLocationIdRef.current;
    const locationChanged = locationChangedRef.current;
    
    // 如果位置变化了，或者首次加载（lastLocationId === null），都需要重新获取天气数据
    if (locationChanged || lastLocationId === null) {
      // 位置变化时，重置首次加载标志，确保会重新计算推荐
      isFirstLoadRef.current = true;
      // 获取新位置的天气数据
      fetchWeatherData();
      // 清除位置变化标记
      locationChangedRef.current = false;
      return;
    }

    // 如果位置没有变化，检查是否有天气数据
    // 如果没有天气数据（被清空了），需要重新获取
    if (lastLocationId === currentLocationId && weatherData === null) {
      isFirstLoadRef.current = true;
      fetchWeatherData();
      return;
    }

    // 如果位置没有变化，且已经有天气数据，就不重新获取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, initializing]);

  // 当天气数据更新后，计算推荐（首次加载或位置变化）
  useEffect(() => {
    if (!currentLocation || !weatherData || initializing) {
      return;
    }

    const isFirstLoad = isFirstLoadRef.current;
    
    // 如果是首次加载（位置变化或天气数据更新），显示全屏 loading 并请求后端
    // 但需要检查是否有 profileChanged 标记，如果有且用户画像没有变化，就不重新计算
    // 注意：位置变化时，profileChanged 标记会被清除，所以位置变化时总是重新计算
    if (isFirstLoad) {
      // 检查是否有 profileChanged 标记（仅在非位置变化的情况下检查）
      const profileChanged = localStorage.getItem('profileChanged') === 'true';
      const currentProfileStr = JSON.stringify(userProfile);
      const previousProfileStr = previousUserProfileRef.current;
      const profileActuallyChanged = currentProfileStr !== previousProfileStr;
      
      // 如果标记存在但用户画像没有变化，说明用户从 Settings 返回但没有修改设置
      // 此时不应该重新计算，直接使用已有的推荐数据
      // 但前提是位置没有变化（如果位置变化了，标记会被清除，这里不会进入）
      if (profileChanged && !profileActuallyChanged && previousProfileStr !== null) {
        // 清除标记，避免误触发
        localStorage.removeItem('profileChanged');
        // 更新 ref，但不重新计算
        previousUserProfileRef.current = currentProfileStr;
        // 标记首次加载完成，避免后续触发
        isFirstLoadRef.current = false;
        return;
      }
      
      setLoading(true);
      // 使用最新的currentLocation和weatherData重新计算
      // 确保在调用时使用最新的currentLocation值（通过闭包捕获）
      const locationToUse = currentLocation;
      calculateRecommendation(0, false, null).finally(() => {
        setLoading(false);
        isFirstLoadRef.current = false; // 标记首次加载完成
        // 更新用户画像 ref，用于下次比较
        previousUserProfileRef.current = JSON.stringify(userProfile);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, weatherData, initializing]);

  // 当活动场景或活动强度改变时，使用本地计算（不请求后端）
  useEffect(() => {
    if (!currentLocation || initializing || isFirstLoadRef.current) {
      return; // 首次加载时跳过，由上面的 useEffect 处理
    }

    // 检查是否可以使用本地计算
    if (canUseLocalCalculation(weatherData, recommendation?.recommendation)) {
      try {
        // 使用本地计算重新生成推荐
        // 使用用户选择的活动场景（户外/室内）
        const recalculated = recalculateRecommendation(
          recommendation.recommendation,
          weatherData,
          isOutdoor, // 使用用户选择的活动场景
          activityLevel,
          userProfile
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

  // 监听用户画像变化，但只有在用户修改了定制属性时才重新计算
  useEffect(() => {
    const currentProfileStr = JSON.stringify(userProfile);
    const previousProfileStr = previousUserProfileRef.current;
    
    // 如果正在初始化或首次加载，只更新 ref，不重新计算
    if (initializing || isFirstLoadRef.current || !currentLocation || !weatherData) {
      previousUserProfileRef.current = currentProfileStr;
      return;
    }

    // 检查是否有 profileChanged 标记
    const profileChanged = localStorage.getItem('profileChanged') === 'true';
    
    // 比较当前和上一次的用户画像
    const profileActuallyChanged = currentProfileStr !== previousProfileStr;

    // 只有当标记存在且用户画像真的变化时才重新计算
    if (profileChanged && profileActuallyChanged) {
      // 清除标记
      localStorage.removeItem('profileChanged');
      
      // 重新计算推荐
      calculateRecommendation(0, true);
    } else if (profileChanged && !profileActuallyChanged) {
      // 如果标记存在但用户画像没有变化，说明用户从 Settings 返回但没有修改设置
      // 清除标记，避免下次误触发
      localStorage.removeItem('profileChanged');
    }

    // 更新 ref
    previousUserProfileRef.current = currentProfileStr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, currentLocation, weatherData, initializing]);

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
                      <label className={isOutdoor ? 'radio-checked' : ''}>
                        <input
                          type="radio"
                          value="outdoor"
                          checked={isOutdoor}
                          onChange={() => setIsOutdoor(true)}
                        />
                        <span>户外</span>
                      </label>
                      <label className={!isOutdoor ? 'radio-checked' : ''}>
                        <input
                          type="radio"
                          value="indoor"
                          checked={!isOutdoor}
                          onChange={() => setIsOutdoor(false)}
                        />
                        <span>室内</span>
                      </label>
                    </div>
                  </div>
                  <div className="setting-item">
                    <label>活动强度</label>
                    <select
                      className="input"
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                    >
                      <option value="low">低（静坐/慢走）</option>
                      <option value="moderate">中（正常步行/轻运动）</option>
                      
                    </select>
                  </div>
                </div>
              </div>

              {recommendation && (
                <>
                  <RecommendationCard 
                    recommendation={recommendation.recommendation}
                    onViewTomorrow={isViewingTomorrow ? handleViewToday : handleViewTomorrow}
                    isViewingTomorrow={isViewingTomorrow}
                  />
                  {recommendation.recommendation.health_messages &&
                    recommendation.recommendation.health_messages.length > 0 && (
                      <HealthAlerts messages={recommendation.recommendation.health_messages} />
                    )}
                </>
              )}

              <WeatherDetail weatherData={weatherData} timezone={currentLocation.timezone || 'Asia/Shanghai'} />
              <DailyForecast dailyData={weatherData.daily} />
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

      {/* 显示刷新按钮：当有位置但没有天气数据或推荐数据时 */}
      {currentLocation && !initializing && !locationLoading && (!weatherData || !recommendation) && !loading && (
        <div className="empty-state">
          <p className="text-gray">内容加载失败</p>
          <p className="text-gray" style={{ fontSize: '14px', marginTop: '8px', marginBottom: '16px' }}>
            请点击刷新按钮重试
          </p>
          <button 
            className="btn-refresh" 
            onClick={handleRefresh}
            disabled={loading || recommendationLoading}
          >
            {loading || recommendationLoading ? (
              <>
                <div className="loading-spinner-small"></div>
                <span>刷新中...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>刷新</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
