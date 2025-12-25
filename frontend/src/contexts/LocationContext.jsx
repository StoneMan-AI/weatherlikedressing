import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import storageManager from '../utils/storage';

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

  // 从存储加载位置信息（支持无痕模式）
  useEffect(() => {
    console.log('LocationContext - 开始加载位置数据');
    console.log('LocationContext - 存储类型:', storageManager.getStorageType());
    const savedLocations = storageManager.getItem('weather_locations');
    const savedCurrentLocationId = storageManager.getItem('weather_current_location_id');
    
    console.log('LocationContext - 从存储读取的数据:', savedLocations ? '有数据' : '无数据');
    console.log('LocationContext - 当前选择的地区ID:', savedCurrentLocationId);
    
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        console.log('LocationContext - 解析后的位置数据，数量:', parsed.length);
        console.log('LocationContext - 位置详情:', parsed);
        // 为旧数据添加last_used_at字段（兼容性处理）
        const parsedWithTimestamp = parsed.map(loc => ({
          ...loc,
          last_used_at: loc.last_used_at || (loc.is_default ? Date.now() : 0)
        }));
        setLocations(parsedWithTimestamp);
        console.log('LocationContext - 已设置位置列表，数量:', parsedWithTimestamp.length);
        
        // 优先恢复用户最后选择的地区
        let targetLocation = null;
        if (savedCurrentLocationId) {
          targetLocation = parsedWithTimestamp.find(loc => loc.id === parseInt(savedCurrentLocationId));
          console.log('LocationContext - 根据保存的ID查找位置:', targetLocation ? '找到' : '未找到');
        }
        
        // 如果保存的地区ID不存在，则使用默认地区或第一个地区
        if (!targetLocation) {
          targetLocation = parsedWithTimestamp.find(loc => loc.is_default) || parsedWithTimestamp[0];
          console.log('LocationContext - 使用默认或第一个位置:', targetLocation ? targetLocation.name : '无');
        }
        
        if (targetLocation) {
          setCurrentLocation(targetLocation);
          console.log('LocationContext - 已设置当前位置:', targetLocation.name);
        }
      } catch (error) {
        console.error('LocationContext - 解析保存的位置数据失败:', error);
      }
    } else {
      console.log('LocationContext - 没有保存的位置数据');
    }
    // 如果没有保存的位置，不在这里设置默认位置，让Home组件来处理
    // 这样可以确保首次打开时能正确初始化
    setLoading(false);
    console.log('LocationContext - 位置数据加载完成');
  }, []);

  // 保存位置到存储（支持无痕模式）
  const saveLocations = (newLocations) => {
    try {
      console.log('saveLocations - 准备保存位置数据，数量:', newLocations.length);
      console.log('saveLocations - 位置数据:', newLocations);
      const locationsJson = JSON.stringify(newLocations);
      const success = storageManager.setItem('weather_locations', locationsJson);
      if (success) {
        setLocations(newLocations);
        console.log(`saveLocations - 成功保存 ${newLocations.length} 个位置，使用存储类型: ${storageManager.getStorageType()}`);
        // 验证保存是否成功
        const saved = storageManager.getItem('weather_locations');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('saveLocations - 验证保存成功，读取到的位置数量:', parsed.length);
        } else {
          console.warn('saveLocations - 警告：保存后无法读取数据');
        }
      } else {
        console.warn('saveLocations - 存储失败，尝试只保留最近使用的10个位置');
        // 如果存储失败，尝试只保留最近使用的10个位置
        const recentLocations = newLocations
          .sort((a, b) => (b.last_used_at || 0) - (a.last_used_at || 0))
          .slice(0, 10);
        const limitedJson = JSON.stringify(recentLocations);
        const retrySuccess = storageManager.setItem('weather_locations', limitedJson);
        if (retrySuccess) {
          setLocations(recentLocations);
          console.log(`saveLocations - 成功保存限制后的位置 (10个)，使用存储类型: ${storageManager.getStorageType()}`);
        } else {
          // 即使存储失败，也更新内存状态，至少在当前会话中可用
          setLocations(newLocations);
          console.warn('saveLocations - 存储完全失败，仅更新内存状态');
        }
      }
    } catch (error) {
      console.error('saveLocations - 保存位置时发生错误:', error);
      // 即使保存失败，也更新内存状态，至少在当前会话中可用
      setLocations(newLocations);
      console.log('saveLocations - 已更新内存状态，位置数量:', newLocations.length);
    }
  };

  // 保存当前选择的地区ID（支持无痕模式）
  const saveCurrentLocationId = (locationId) => {
    if (locationId) {
      storageManager.setItem('weather_current_location_id', locationId.toString());
    } else {
      storageManager.removeItem('weather_current_location_id');
    }
  };

  // 添加位置
  const addLocation = (location) => {
    console.log('addLocation - 开始添加位置:', location.name, '当前locations数量:', locations.length);
    
    // 检查位置是否已存在（通过经纬度判断，允许0.001度的误差）
    const existingLocation = locations.find(loc => {
      const latDiff = Math.abs(loc.latitude - location.latitude);
      const lonDiff = Math.abs(loc.longitude - location.longitude);
      return latDiff < 0.001 && lonDiff < 0.001;
    });

    // 如果位置已存在，更新最近使用时间并返回现有位置
    if (existingLocation) {
      console.log('addLocation - 位置已存在，更新最近使用时间:', existingLocation.name);
      const now = Date.now();
      const updatedLocations = locations.map(loc => 
        loc.id === existingLocation.id 
          ? { ...loc, last_used_at: now }
          : loc
      );
      saveLocations(updatedLocations);
      const updatedLocation = { ...existingLocation, last_used_at: now };
      setCurrentLocation(updatedLocation);
      saveCurrentLocationId(updatedLocation.id);
      return updatedLocation;
    }

    // 位置不存在，创建新位置
    console.log('addLocation - 位置不存在，创建新位置:', location.name);
    const newLocation = {
      id: Date.now(),
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || 'Asia/Shanghai',
      is_default: location.is_default || false,
      last_used_at: Date.now() // 添加最近使用时间
    };

    let newLocations;
    if (newLocation.is_default) {
      // 取消其他位置的默认状态
      newLocations = locations.map(loc => ({ ...loc, is_default: false }));
      newLocations.push(newLocation);
    } else {
      // 添加到现有位置列表，保留所有历史位置
      newLocations = [...locations, newLocation];
    }

    console.log('addLocation - 准备保存位置列表，新列表数量:', newLocations.length);
    console.log('addLocation - 新位置详情:', newLocation);

    // 保存所有位置（包括历史位置）
    saveLocations(newLocations);
    
    if (newLocation.is_default || locations.length === 0) {
      // 新添加的位置被设为当前时，直接设置（last_used_at已经在创建时设置）
      // 注意：这里直接使用内部的 setCurrentLocation 状态更新函数
      // 而不是通过导出的 setCurrentLocation（它映射到 setCurrentLocationWithSave）
      // 因为 setCurrentLocationWithSave 会使用旧的 locations 状态，导致数据被覆盖
      console.log('addLocation - 设置新位置为当前位置');
      // 直接设置状态，不触发 setCurrentLocationWithSave
      setCurrentLocation(newLocation);
      saveCurrentLocationId(newLocation.id);
      // 注意：不需要调用 setCurrentLocationWithSave，因为：
      // 1. 新位置已经在 newLocations 中
      // 2. last_used_at 已经在创建时设置了
      // 3. saveLocations 已经保存了完整列表（包含2个位置）
    }

    console.log('addLocation - 位置添加完成，返回新位置');
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

  // 设置当前位置（增强版，保存到localStorage，并更新最近使用时间）
  const setCurrentLocationWithSave = (location) => {
    if (location) {
      const now = Date.now();
      // 使用函数式更新，确保使用最新的 locations 状态
      setLocations(currentLocations => {
        // 检查位置是否在列表中
        const locationExists = currentLocations.some(loc => loc.id === location.id);
        if (!locationExists) {
          console.warn('setCurrentLocationWithSave - 位置不在列表中，跳过更新:', location.id);
          // 如果位置不在列表中，只更新当前状态，不保存
          const updatedLocation = { ...location, last_used_at: now };
          setCurrentLocation(updatedLocation);
          saveCurrentLocationId(location.id);
          return currentLocations; // 返回原列表，不修改
        }
        
        // 更新该地区的最近使用时间
        const newLocations = currentLocations.map(loc => 
          loc.id === location.id 
            ? { ...loc, last_used_at: now }
            : loc
        );
        saveLocations(newLocations);
        // 更新当前location对象，包含最新的last_used_at
        const updatedLocation = { ...location, last_used_at: now };
        setCurrentLocation(updatedLocation);
        saveCurrentLocationId(location.id);
        return newLocations;
      });
    } else {
      setCurrentLocation(null);
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

  // 通过城市名称查询位置（通过后端API，支持缓存和模糊匹配）
  const searchLocationByCityName = async (cityName) => {
    try {
      // 调用后端API进行城市搜索
      const response = await axios.get('/api/locations/search', {
        params: { city: cityName }
      });
      
      if (response.data.success) {
        // 如果返回多个结果，需要用户选择
        if (response.data.multiple) {
          return {
            multiple: true,
            results: response.data.data.map(item => ({
              id: item.id,
              name: item.name,
              display_name: item.display_name,
              latitude: item.latitude,
              longitude: item.longitude,
              timezone: item.timezone || 'Asia/Shanghai',
              country_code: item.country_code,
              country_name: item.country_name,
              state: item.state,
              is_default: false
            }))
          };
        }
        
        // 单个结果，直接返回
        const item = response.data.data;
        return {
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          timezone: item.timezone || 'Asia/Shanghai',
          is_default: false
        };
      }
      
      throw new Error('搜索失败');
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


