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

  // 通过IP获取位置
  const getLocationByIP = async () => {
    try {
      // 使用免费的IP定位服务
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      
      if (data.latitude && data.longitude) {
        const location = {
          name: data.city || '当前位置',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone || 'Asia/Shanghai',
          is_default: true
        };
        
        return location;
      }
      throw new Error('无法获取位置信息');
    } catch (error) {
      console.error('IP定位失败:', error);
      throw error;
    }
  };

  // 通过浏览器API获取位置
  const getLocationByGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理位置API'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // 尝试通过逆地理编码获取城市名称
          try {
            // 使用免费的逆地理编码服务
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
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
              timezone: 'Asia/Shanghai', // 可以根据时区API获取
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
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
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
    searchLocationByCityName
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};


