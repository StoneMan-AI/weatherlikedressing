import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import './LocationSelector.css';

const LocationSelector = () => {
  const navigate = useNavigate();
  const {
    locations,
    currentLocation,
    setCurrentLocation,
    addLocation,
    deleteLocation,
    searchLocationByCityName
  } = useLocationContext();
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [cityName, setCityName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // 存储多个搜索结果
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [hasCustomProfile, setHasCustomProfile] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // 检查用户是否设置了私人定制
  const checkCustomProfile = () => {
    // 检查localStorage
    const savedFlag = localStorage.getItem('hasCustomProfile') === 'true';
    
    // 检查用户数据
    const profile = user?.profile_json || {};
    const hasCustomSettings = 
      (profile.age_group && profile.age_group !== 'adult') ||
      (profile.sensitivity && profile.sensitivity !== 'none') ||
      (profile.conditions && profile.conditions.length > 0);
    
    return savedFlag || hasCustomSettings;
  };

  // 初始化时检查
  useEffect(() => {
    setHasCustomProfile(checkCustomProfile());
  }, [user]);

  // 监听自定义事件，当私人定制更新时刷新状态
  useEffect(() => {
    const handleCustomProfileUpdate = () => {
      setHasCustomProfile(checkCustomProfile());
    };

    window.addEventListener('customProfileUpdated', handleCustomProfileUpdate);
    return () => {
      window.removeEventListener('customProfileUpdated', handleCustomProfileUpdate);
    };
  }, [user]);

  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) {
      alert('请输入城市名称');
      return;
    }

    setSearching(true);
    setSearchResults(null); // 清空之前的搜索结果
    try {
      const result = await searchLocationByCityName(cityName.trim());
      
      // 如果返回多个结果，显示选择列表
      if (result.multiple && result.results && result.results.length > 0) {
        setSearchResults(result.results);
        return; // 不关闭表单，让用户选择
      }
      
      // 单个结果，直接添加
      const newLocation = addLocation(result);
      if (newLocation) {
        setCurrentLocation(newLocation);
      }
      setCityName('');
      setShowAddForm(false);
      setSearchResults(null);
    } catch (error) {
      alert('未找到该城市，请检查城市名称是否正确');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  // 处理用户选择搜索结果
  const handleSelectSearchResult = (result) => {
    const location = {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone || 'Asia/Shanghai',
      is_default: false
    };
    
    const newLocation = addLocation(location);
    if (newLocation) {
      setCurrentLocation(newLocation);
    }
    setCityName('');
    setShowAddForm(false);
    setSearchResults(null);
  };


  // 按最近使用时间排序地区列表（最近使用的在前）
  const sortedLocations = [...locations].sort((a, b) => {
    // 首先按最近使用时间降序排序
    const timeA = a.last_used_at || 0;
    const timeB = b.last_used_at || 0;
    if (timeB !== timeA) {
      return timeB - timeA; // 降序，最近使用的在前
    }
    // 如果时间相同，默认地区优先
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    // 否则按ID排序
    return a.id - b.id;
  });

  // 计算下拉框位置
  useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const updatePosition = () => {
        const trigger = triggerRef.current;
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isDropdownOpen]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectLocation = (location) => {
    setCurrentLocation(location);
    setIsDropdownOpen(false);
  };

  const handleDeleteLocation = (e, id) => {
    e.stopPropagation();
    if (locations.length <= 1) {
      alert('至少需要保留一个位置');
      return;
    }
    if (confirm('确定要删除这个位置吗？')) {
      deleteLocation(id);
      // 如果删除的是当前选中的位置，切换到第一个位置
      if (currentLocation?.id === id) {
        const remainingLocations = locations.filter(loc => loc.id !== id);
        if (remainingLocations.length > 0) {
          setCurrentLocation(remainingLocations[0]);
        }
      }
    }
  };

  return (
    <div className="location-selector">
      <div className="location-header">
        <div className="location-title-section">
          <h2 className="location-title">
            {currentLocation?.name || '选择位置'}
          </h2>
          {locations.length > 1 && (
            <>
              <button
                ref={triggerRef}
                className="location-select-trigger"
                onClick={handleToggleDropdown}
                type="button"
              >
                <span className="location-select-text">
                  {currentLocation?.name || '选择位置'}
                </span>
                <span className={`location-select-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              {isDropdownOpen && createPortal(
                <div
                  ref={dropdownRef}
                  className="location-dropdown-custom"
                  style={{
                    position: 'absolute',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    minWidth: '200px'
                  }}
                >
                  <div className="location-dropdown-list">
                    {sortedLocations.map(location => (
                      <div
                        key={location.id}
                        className={`location-dropdown-item-custom ${
                          currentLocation?.id === location.id ? 'active' : ''
                        }`}
                        onClick={() => handleSelectLocation(location)}
                      >
                        <span className="location-dropdown-name-custom">
                          {location.name}
                          {location.is_default && (
                            <span className="default-badge-custom">默认</span>
                          )}
                        </span>
                        {locations.length > 1 && (
                          <button
                            className="btn-delete-location-custom"
                            onClick={(e) => handleDeleteLocation(e, location.id)}
                            type="button"
                            title="删除"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        <div className="location-actions">
          <button
            className="btn-custom-profile"
            onClick={() => navigate('/settings')}
            title="私人定制"
            style={{ position: 'relative' }}
          >
            私人定制
            {hasCustomProfile && (
              <span className="custom-profile-badge" />
            )}
          </button>
          <button
            className="btn-travel-guide"
            onClick={() => {
              const travelSection = document.getElementById('travel-recommendation-section');
              if (travelSection) {
                travelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            title="外出旅行"
          >
            外出旅行
          </button>
          <button
            className="btn-add-location"
            onClick={() => setShowAddForm(!showAddForm)}
            title={showAddForm ? '取消添加' : '添加位置'}
          >
            {showAddForm ? '取消' : '+'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-location-form-wrapper">
          <form onSubmit={handleSearchCity} className="add-location-form">
            <input
              type="text"
              className="city-search-input"
              placeholder="输入城市名称，如：北京、上海、New York"
              value={cityName}
              onChange={(e) => {
                setCityName(e.target.value);
                setSearchResults(null); // 输入时清空搜索结果
              }}
              disabled={searching}
            />
            <button
              type="submit"
              className="btn-search-city"
              disabled={searching}
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </form>
          
          {/* 显示多个搜索结果 */}
          {searchResults && searchResults.length > 0 && (
            <div className="search-results-list">
              <div className="search-results-header">
                <span>找到 {searchResults.length} 个匹配结果，请选择：</span>
              </div>
              {searchResults.map((result, index) => (
                <div
                  key={result.id || index}
                  className="search-result-item"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  <div className="result-name">{result.name}</div>
                  {result.display_name && result.display_name !== result.name && (
                    <div className="result-display-name">{result.display_name}</div>
                  )}
                  {result.state && (
                    <div className="result-location">
                      {result.state}
                      {result.country_name && `, ${result.country_name}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
