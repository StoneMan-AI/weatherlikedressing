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
import { recalculateRecommendation, canUseLocalCalculation, calculateComfortScore, getDressingRecommendation, generateDetailedReason } from '../utils/recommendationCalculator';
import storageManager from '../utils/storage';
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
  
  // 优先使用本地存储的用户画像数据，如果没有则使用user对象中的数据
  const [userProfile, setUserProfile] = useState(() => {
    // 初始化时从本地存储加载用户画像数据
    const savedProfile = storageManager.getItem('user_profile');
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        console.error('Failed to parse saved user profile:', e);
      }
    }
    // 如果没有本地存储的数据，使用user对象中的数据
    return user?.profile_json || {};
  });
  
  // 当user对象更新时，同步更新本地存储的用户画像数据（但不覆盖本地存储）
  useEffect(() => {
    if (user?.profile_json) {
      const currentSavedProfile = storageManager.getItem('user_profile');
      // 如果本地存储没有数据，或者user对象的数据更新，则更新本地存储
      if (!currentSavedProfile) {
        storageManager.setItem('user_profile', JSON.stringify(user.profile_json));
        setUserProfile(user.profile_json);
      } else {
        // 如果本地存储有数据，优先使用本地存储的数据
        try {
          const parsed = JSON.parse(currentSavedProfile);
          setUserProfile(parsed);
        } catch (e) {
          console.error('Failed to parse saved user profile:', e);
          setUserProfile(user.profile_json);
        }
      }
    }
  }, [user]);
  
  // 监听customProfileUpdated事件，更新本地存储的用户画像数据
  useEffect(() => {
    const handleProfileUpdate = () => {
      // 从user对象获取最新的用户画像数据
      if (user?.profile_json) {
        storageManager.setItem('user_profile', JSON.stringify(user.profile_json));
        setUserProfile(user.profile_json);
      }
    };
    
    window.addEventListener('customProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('customProfileUpdated', handleProfileUpdate);
    };
  }, [user]);

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
  
  // 监听 customProfileUpdated 事件，确保从Settings返回时能正确触发计算
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('收到 customProfileUpdated 事件，准备重新计算');
      // 延迟一下，确保userProfile已经更新
      setTimeout(() => {
        // 从最新的user获取userProfile，避免闭包问题
        const latestUserProfile = user?.profile_json || {};
        const currentProfileStr = JSON.stringify(latestUserProfile);
        const previousProfileStr = previousUserProfileRef.current;
        const profileChanged = localStorage.getItem('profileChanged') === 'true';
        const profileActuallyChanged = currentProfileStr !== previousProfileStr;
        
        console.log('事件触发后的检查:', {
          profileChanged,
          profileActuallyChanged,
          currentProfileStr,
          previousProfileStr,
          hasLocation: !!currentLocation,
          hasWeatherData: !!weatherData,
          initializing,
          isFirstLoad: isFirstLoadRef.current
        });
        
        // 如果标记存在，且有必要的条件，则触发计算
        // 注意：即使profileActuallyChanged为false，如果有标记也应该重新计算（可能是userProfile还没更新）
        if (profileChanged && currentLocation && weatherData && !initializing && !isFirstLoadRef.current) {
          console.log('通过事件触发重新计算');
          
          // 优先使用本地计算
          if (weatherData && weatherData.current && weatherData.current.temperature_c !== undefined) {
            try {
              // 检查是否有原有推荐
              const hasExistingRecommendation = recommendation?.recommendation && canUseLocalCalculation(weatherData, recommendation.recommendation);
              
              if (hasExistingRecommendation) {
                // 如果有原有推荐，使用本地计算更新
                const recalculated = recalculateRecommendation(
                  recommendation.recommendation,
                  weatherData,
                  isOutdoor,
                  activityLevel,
                  latestUserProfile
                );
                setRecommendation({
                  ...recommendation,
                  recommendation: recalculated
                });
                console.log('事件触发：本地计算完成（更新推荐）', recalculated);
              } else {
                // 如果没有原有推荐，使用本地计算生成新推荐
                const current = weatherData.current || {};
                const inputs = {
                  temperature_c: current.temperature_c || 0,
                  relative_humidity: current.relative_humidity || 0,
                  wind_m_s: current.wind_m_s || 0,
                  gust_m_s: current.gust_m_s || 0,
                  uv_index: current.uv_index || 0
                };
                const scoreDetails = calculateComfortScore(weatherData, isOutdoor, activityLevel, latestUserProfile);
                const dressingLayer = getDressingRecommendation(scoreDetails.ComfortScore);
                const reasonSummary = generateDetailedReason(inputs, scoreDetails);
                const newRecommendation = {
                  comfort_score: scoreDetails.ComfortScore,
                  score_details: scoreDetails,
                  recommendation_layers: dressingLayer.layers,
                  accessories: dressingLayer.accessories,
                  label: dressingLayer.label,
                  notes: dressingLayer.notes,
                  reason_summary: reasonSummary,
                  health_messages: []
                };
                setRecommendation({
                  recommendation: newRecommendation
                });
                console.log('事件触发：本地计算完成（新推荐）', newRecommendation);
              }
              
              // 清除标记（在成功计算后清除）
              localStorage.removeItem('profileChanged');
              // 更新 ref
              previousUserProfileRef.current = currentProfileStr;
            } catch (error) {
              console.error('事件触发：本地计算失败，回退到API:', error);
              // 如果本地计算失败，清除标记并回退到API
              localStorage.removeItem('profileChanged');
              calculateRecommendation(0, true);
            }
          } else {
            console.log('事件触发：天气数据不完整，回退到API');
            // 如果天气数据不完整，清除标记并回退到API
            localStorage.removeItem('profileChanged');
            calculateRecommendation(0, true);
          }
        } else {
          console.log('事件触发：条件不满足，跳过计算', {
            profileChanged,
            hasLocation: !!currentLocation,
            hasWeatherData: !!weatherData,
            initializing,
            isFirstLoad: isFirstLoadRef.current
          });
        }
      }, 200); // 增加延迟时间，确保userProfile已经更新
    };
    
    window.addEventListener('customProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('customProfileUpdated', handleProfileUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentLocation, weatherData, initializing, recommendation, isOutdoor, activityLevel]);

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

  // 获取天气数据（带超时机制）
  const fetchWeatherData = async (timeout = 10000) => {
    if (!currentLocation) {
      return null;
    }

    try {
      // 创建超时 Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), timeout);
      });

      // 创建请求 Promise
      const requestPromise = axios.get('/api/weather/forecast', {
        params: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timezone: currentLocation.timezone || 'Asia/Shanghai',
          days: 15
        },
        timeout: timeout // axios 的超时配置
      });

      // 使用 Promise.race 实现超时控制
      const res = await Promise.race([requestPromise, timeoutPromise]);
      setWeatherData(res.data.data);
      return res.data.data; // 返回天气数据
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
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

  // 当位置改变时，标记位置变化（不清空数据，让后续逻辑处理）
  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    const currentLocationId = currentLocation.id || `${currentLocation.latitude}_${currentLocation.longitude}`;
    
    // 如果位置发生了变化，标记位置变化，但不清空数据
    // 数据会在后续的useEffect中根据位置变化自动更新
    if (lastLocationIdRef.current !== null && lastLocationIdRef.current !== currentLocationId) {
      console.log('Location changed, marking location change (not clearing data)');
      setIsViewingTomorrow(false); // 重置"看明天"状态
      isFirstLoadRef.current = true; // 重置首次加载标志，确保会重新计算推荐
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
      // 直接从 user 对象获取最新的 profile_json，避免使用可能过时的 userProfile
      const currentUserProfile = user?.profile_json || {};
      const currentProfileStr = JSON.stringify(currentUserProfile);
      const previousProfileStr = previousUserProfileRef.current;
      const profileActuallyChanged = currentProfileStr !== previousProfileStr;
      
      // 如果标记存在但用户画像没有变化，说明用户从 Settings 返回但没有修改设置
      // 此时不应该重新计算，直接使用已有的推荐数据
      // 但前提是位置没有变化（如果位置变化了，标记会被清除，这里不会进入）
      // 注意：如果 previousProfileStr 为 null，说明是首次加载，应该正常计算
      if (profileChanged && !profileActuallyChanged && previousProfileStr !== null) {
        console.log('首次加载：检测到profileChanged标记但用户画像未变化，跳过API请求');
        // 清除标记，避免误触发
        localStorage.removeItem('profileChanged');
        // 更新 ref，但不重新计算
        previousUserProfileRef.current = currentProfileStr;
        // 标记首次加载完成，避免后续触发
        isFirstLoadRef.current = false;
        return;
      }
      
      // 如果有 profileChanged 标记且用户画像真的变化了，说明用户修改了设置
      // 此时应该使用本地计算，而不是API请求（避免重复请求）
      if (profileChanged && profileActuallyChanged) {
        console.log('首次加载：检测到profileChanged标记且用户画像变化，使用本地计算', {
          currentProfileStr,
          previousProfileStr
        });
        // 清除标记（在开始计算前清除，避免重复触发）
        localStorage.removeItem('profileChanged');
        
        // 使用本地计算生成推荐
        // 注意：使用 currentUserProfile（从 user 对象直接获取），而不是 userProfile（可能还没更新）
        if (weatherData && weatherData.current && weatherData.current.temperature_c !== undefined) {
          try {
            const current = weatherData.current || {};
            const inputs = {
              temperature_c: current.temperature_c || 0,
              relative_humidity: current.relative_humidity || 0,
              wind_m_s: current.wind_m_s || 0,
              gust_m_s: current.gust_m_s || 0,
              uv_index: current.uv_index || 0
            };
            const scoreDetails = calculateComfortScore(weatherData, isOutdoor, activityLevel, currentUserProfile);
            const dressingLayer = getDressingRecommendation(scoreDetails.ComfortScore);
            const reasonSummary = generateDetailedReason(inputs, scoreDetails);
            const newRecommendation = {
              comfort_score: scoreDetails.ComfortScore,
              score_details: scoreDetails,
              recommendation_layers: dressingLayer.layers,
              accessories: dressingLayer.accessories,
              label: dressingLayer.label,
              notes: dressingLayer.notes,
              reason_summary: reasonSummary,
              health_messages: []
            };
            setRecommendation({
              recommendation: newRecommendation
            });
            console.log('首次加载：本地计算完成（新推荐）', newRecommendation);
            // 更新用户画像 ref
            previousUserProfileRef.current = currentProfileStr;
            // 标记首次加载完成（在计算完成后立即标记，避免重复触发）
            isFirstLoadRef.current = false;
            return;
          } catch (error) {
            console.error('首次加载：本地计算失败，回退到API:', error);
            // 如果本地计算失败，回退到API请求
            // 注意：这里不设置 isFirstLoadRef.current = false，让后续的API请求流程处理
          }
        }
      }
      
      // 如果没有 profileChanged 标记，或者用户画像没有变化，使用API请求
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
  }, [currentLocation, weatherData, initializing, user]); // 添加 user 依赖，确保 user 更新时重新计算

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
    
    // 检查是否有 profileChanged 标记
    const profileChanged = localStorage.getItem('profileChanged') === 'true';
    
    // 比较当前和上一次的用户画像
    const profileActuallyChanged = currentProfileStr !== previousProfileStr;

    // 如果正在初始化或首次加载，但有 profileChanged 标记，说明用户从Settings返回
    // 此时应该等待初始化完成后再计算，或者直接使用本地计算
    if (initializing || isFirstLoadRef.current || !currentLocation || !weatherData) {
      // 如果有 profileChanged 标记，保留它，等待条件满足后再计算
      // 如果没有标记，更新 ref（只在用户画像真的变化时更新，避免首次加载时重复更新）
      if (!profileChanged && previousProfileStr !== null) {
        previousUserProfileRef.current = currentProfileStr;
      } else if (previousProfileStr === null) {
        // 首次加载时，初始化 ref
        previousUserProfileRef.current = currentProfileStr;
      }
      return;
    }

    // 只有在用户画像真的变化或者有 profileChanged 标记时才输出日志和执行计算
    if (!profileChanged && !profileActuallyChanged) {
      // 用户画像没有变化，也没有标记，直接返回
      return;
    }

    console.log('用户画像变化检查:', {
      profileChanged,
      profileActuallyChanged,
      currentProfileStr,
      previousProfileStr
    });

    // 如果标记存在，即使用户画像看起来没变化，也应该重新计算
    // 因为可能是 userProfile 还没更新，或者需要强制刷新
    if (profileChanged) {
      // 如果用户画像真的变化了，或者 previousProfileStr 为 null（首次），都应该重新计算
      if (profileActuallyChanged || previousProfileStr === null) {
        console.log('开始重新计算推荐（用户画像变化）');
        // 清除标记
        localStorage.removeItem('profileChanged');
        
        // 优先使用本地计算（如果有完整数据），避免请求后端
        // 即使没有原有推荐，只要有天气数据，也可以使用本地计算生成新推荐
        if (weatherData && weatherData.current && weatherData.current.temperature_c !== undefined) {
          try {
            // 如果有原有推荐，使用本地计算更新
            if (recommendation?.recommendation && canUseLocalCalculation(weatherData, recommendation.recommendation)) {
              // 使用本地计算重新生成推荐
              const recalculated = recalculateRecommendation(
                recommendation.recommendation,
                weatherData,
                isOutdoor,
                activityLevel,
                userProfile
              );

              // 更新推荐结果
              setRecommendation({
                ...recommendation,
                recommendation: recalculated
              });
              console.log('用户画像变化：本地计算完成（更新推荐）', recalculated);
            } else {
              // 如果没有原有推荐，使用本地计算生成新推荐
              const current = weatherData.current || {};
              const inputs = {
                temperature_c: current.temperature_c || 0,
                relative_humidity: current.relative_humidity || 0,
                wind_m_s: current.wind_m_s || 0,
                gust_m_s: current.gust_m_s || 0,
                uv_index: current.uv_index || 0
              };
              
              // 使用本地规则引擎生成推荐
              const scoreDetails = calculateComfortScore(weatherData, isOutdoor, activityLevel, userProfile);
              const dressingLayer = getDressingRecommendation(scoreDetails.ComfortScore);
              const reasonSummary = generateDetailedReason(inputs, scoreDetails);
              
              // 创建新的推荐结果
              const newRecommendation = {
                comfort_score: scoreDetails.ComfortScore,
                score_details: scoreDetails,
                recommendation_layers: dressingLayer.layers,
                accessories: dressingLayer.accessories,
                label: dressingLayer.label,
                notes: dressingLayer.notes,
                reason_summary: reasonSummary,
                health_messages: [] // 本地计算不包含健康提醒
              };
              
              setRecommendation({
                recommendation: newRecommendation
              });
              console.log('本地计算完成（新推荐）:', newRecommendation);
            }
          } catch (error) {
            console.error('Local calculation failed, falling back to API:', error);
            // 如果本地计算失败，回退到API请求
            calculateRecommendation(0, true);
          }
        } else {
          console.log('天气数据不完整，回退到API请求');
          // 如果没有完整数据，回退到API请求
          calculateRecommendation(0, true);
        }
      } else {
        // 如果标记存在但用户画像没有变化，且 previousProfileStr 不为 null
        // 说明用户从 Settings 返回但没有修改设置，清除标记
        console.log('清除profileChanged标记（用户画像未变化）');
        localStorage.removeItem('profileChanged');
      }
    } else if (!profileChanged && profileActuallyChanged) {
      console.log('用户画像变化但无标记，可能是页面刷新导致');
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

    </div>
  );
};

export default Home;
