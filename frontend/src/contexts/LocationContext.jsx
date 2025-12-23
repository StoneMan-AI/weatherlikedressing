import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LocationContext = createContext();

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从localStorage加载位置信息
  useEffect(() => {
    const savedLocations = localStorage.getItem('weather_locations');
    const savedCurrentLocationId = localStorage.getItem('weather_current_location_id');
    
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        setLocations(parsed);
        
        // 优先恢复用户最后选择的地区
        let targetLocation = null;
        if (savedCurrentLocationId) {
          targetLocation = parsed.find(loc => loc.id === parseInt(savedCurrentLocationId));
        }
        
        // 如果保存的地区ID不存在，则使用默认地区或第一个地区
        if (!targetLocation) {
          targetLocation = parsed.find(loc => loc.is_default) || parsed[0];
        }
        
        if (targetLocation) {
          setCurrentLocation(targetLocation);
        }
      } catch (error) {
        console.error('Failed to parse saved locations:', error);
      }
    }
    // 如果没有保存的位置，不在这里设置默认位置，让Home组件来处理
    // 这样可以确保首次打开时能正确初始化
    setLoading(false);
  }, []);

  // 保存位置到localStorage
  const saveLocations = (newLocations) => {
    localStorage.setItem('weather_locations', JSON.stringify(newLocations));
    setLocations(newLocations);
  };

  // 保存当前选择的地区ID
  const saveCurrentLocationId = (locationId) => {
    if (locationId) {
      localStorage.setItem('weather_current_location_id', locationId.toString());
    } else {
      localStorage.removeItem('weather_current_location_id');
    }
  };

  // 添加位置
  const addLocation = (location) => {
    const newLocation = {
      id: Date.now(),
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || 'Asia/Shanghai',
      is_default: location.is_default || false
    };

    let newLocations;
    if (newLocation.is_default) {
      // 取消其他位置的默认状态
      newLocations = locations.map(loc => ({ ...loc, is_default: false }));
      newLocations.push(newLocation);
    } else {
      newLocations = [...locations, newLocation];
    }

    saveLocations(newLocations);
    
    if (newLocation.is_default || locations.length === 0) {
      setCurrentLocation(newLocation);
      saveCurrentLocationId(newLocation.id);
    }

    return newLocation;
  };

  // 删除位置
  const deleteLocation = (id) => {
    const newLocations = locations.filter(loc => loc.id !== id);
    saveLocations(newLocations);
    
    if (currentLocation?.id === id) {
      const newCurrent = newLocations.find(loc => loc.is_default) || newLocations[0];
      if (newCurrent) {
        setCurrentLocation(newCurrent);
        saveCurrentLocationId(newCurrent.id);
      } else {
        setCurrentLocation(null);
        saveCurrentLocationId(null);
      }
    }
  };

  // 设置默认位置
  const setDefaultLocation = (id) => {
    const newLocations = locations.map(loc => ({
      ...loc,
      is_default: loc.id === id
    }));
    saveLocations(newLocations);
    const newDefault = newLocations.find(loc => loc.id === id);
    if (newDefault) {
      setCurrentLocation(newDefault);
      saveCurrentLocationId(newDefault.id);
    }
  };

  // 设置当前位置（增强版，保存到localStorage）
  const setCurrentLocationWithSave = (location) => {
    setCurrentLocation(location);
    if (location) {
      saveCurrentLocationId(location.id);
    } else {
      saveCurrentLocationId(null);
    }
  };

  // 通过IP获取位置（支持多个IP定位服务，提高可靠性）
  const getLocationByIP = async () => {
    // IP定位服务列表（按优先级排序）
    const ipServices = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        parser: (data) => ({
          name: data.city || '当前位置',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone || 'Asia/Shanghai',
          is_default: true
        })
      },
      {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,timezone',
        parser: (data) => {
          if (data.status === 'success') {
            return {
              name: data.city || '当前位置',
              latitude: data.lat,
              longitude: data.lon,
              timezone: data.timezone || 'Asia/Shanghai',
              is_default: true
            };
          }
          throw new Error(data.message || 'IP定位失败');
        }
      },
      {
        name: 'ipinfo.io',
        url: 'https://ipinfo.io/json',
        parser: (data) => {
          if (data.loc) {
            const [latitude, longitude] = data.loc.split(',');
            return {
              name: data.city || '当前位置',
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              timezone: data.timezone || 'Asia/Shanghai',
              is_default: true
            };
          }
          throw new Error('无法解析位置信息');
        }
      }
    ];

    // 依次尝试每个IP定位服务
    for (const service of ipServices) {
      try {
        console.log(`尝试使用 ${service.name} 进行IP定位...`);
        const response = await axios.get(service.url, {
          timeout: 5000 // 5秒超时
        });
        const data = response.data;
        
        const location = service.parser(data);
        if (location.latitude && location.longitude) {
          console.log(`IP定位成功（${service.name}）:`, location.name);
          return location;
        }
      } catch (error) {
        console.warn(`${service.name} IP定位失败:`, error.message);
        // 继续尝试下一个服务
        continue;
      }
    }
    
    // 所有IP定位服务都失败
    throw new Error('所有IP定位服务均失败');
  };

  // 检查地理位置权限状态
  const checkGeolocationPermission = () => {
    if (!navigator.geolocation || !navigator.permissions) {
      return 'unsupported';
    }
    
    try {
      // 注意：permissions API在某些浏览器中可能不支持
      return navigator.permissions.query({ name: 'geolocation' }).then(
        (result) => result.state,
        () => 'unknown'
      );
    } catch (error) {
      return Promise.resolve('unknown');
    }
  };

  // 通过浏览器API获取位置（增强版，支持权限检查）
  const getLocationByGeolocation = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理位置API'));
        return;
      }

      // 检查权限状态（如果支持）
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            reject(new Error('用户已拒绝位置权限'));
            return;
          }
          
          // 如果权限是prompt或granted，继续获取位置
          attemptGetLocation(resolve, reject, retryCount);
        }).catch(() => {
          // 如果权限查询失败，直接尝试获取位置
          attemptGetLocation(resolve, reject, retryCount);
        });
      } else {
        // 不支持权限API，直接尝试获取位置
        attemptGetLocation(resolve, reject, retryCount);
      }
    });
  };

  // 尝试获取位置的内部函数
  const attemptGetLocation = (resolve, reject, retryCount) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 尝试通过逆地理编码获取城市名称
        try {
          // 使用免费的逆地理编码服务
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'WeatherApp/1.0'
              }
            }
          );
          const data = response.data;
          const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village ||
                          data.address?.county ||
                          '当前位置';
          
          resolve({
            name: cityName,
            latitude,
            longitude,
            timezone: 'Asia/Shanghai',
            is_default: true
          });
        } catch (error) {
          // 如果逆地理编码失败，仍然返回坐标
          resolve({
            name: '当前位置',
            latitude,
            longitude,
            timezone: 'Asia/Shanghai',
            is_default: true
          });
        }
      },
      (error) => {
        // 如果是权限被拒绝，直接拒绝
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('用户已拒绝位置权限'));
        } else if (error.code === error.TIMEOUT && retryCount < 1) {
          // 超时且未重试过，延迟后重试一次
          setTimeout(() => {
            attemptGetLocation(resolve, reject, retryCount + 1);
          }, 1000);
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 增加超时时间到15秒
        maximumAge: 0
      }
    );
  };

  // 获取默认位置（北京）
  const getDefaultLocation = () => {
    return {
      name: '北京',
      latitude: 39.9042,
      longitude: 116.4074,
      timezone: 'Asia/Shanghai',
      is_default: true
    };
  };

  // 通过城市名称查询位置
  const searchLocationByCityName = async (cityName) => {
    try {
      // 使用OpenStreetMap Nominatim API进行地理编码
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1&addressdetails=1`
      );
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          name: result.display_name.split(',')[0] || cityName,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          timezone: 'Asia/Shanghai', // 可以根据时区API获取
          is_default: false
        };
      }
      throw new Error('未找到该城市');
    } catch (error) {
      console.error('城市查询失败:', error);
      throw error;
    }
  };

  const value = {
    locations,
    currentLocation,
    loading,
    addLocation,
    deleteLocation,
    setDefaultLocation,
    setCurrentLocation: setCurrentLocationWithSave,
    getLocationByIP,
    getLocationByGeolocation,
    searchLocationByCityName,
    getDefaultLocation
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};


