import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../contexts/LocationContext';
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [cityName, setCityName] = useState('');
  const [searching, setSearching] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // 存储多个搜索结果
  const locationDropdownRef = useRef(null);
  const locationTriggerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

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

  const handleDeleteLocation = (id) => {
    if (locations.length <= 1) {
      alert('至少需要保留一个位置');
      return;
    }
    if (confirm('确定要删除这个位置吗？')) {
      deleteLocation(id);
    }
  };

  // 计算下拉框位置
  useEffect(() => {
    if (isLocationDropdownOpen && locationTriggerRef.current) {
      const updatePosition = () => {
        if (locationTriggerRef.current) {
          const rect = locationTriggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const dropdownMaxHeight = 200;
          const gap = 4;
          
          let top = rect.bottom + gap;
          let left = rect.left;
          let width = rect.width;
          
          const spaceBelow = viewportHeight - rect.bottom - gap;
          const spaceAbove = rect.top - gap;
          
          if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
            top = rect.top - dropdownMaxHeight - gap;
            if (top < 10) {
              top = 10;
            }
          }
          
          setDropdownPosition({ top, left, width });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isLocationDropdownOpen]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationTriggerRef.current &&
        !locationTriggerRef.current.contains(event.target) &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };

    if (isLocationDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isLocationDropdownOpen]);

  return (
    <div className="location-selector">
      <div className="location-header">
        <div className="location-title-section">
          <h2 className="location-title">
            {currentLocation?.name || '选择位置'}
          </h2>
          {locations.length > 1 && (
            <div className="location-dropdown-wrapper">
              <div
                ref={locationTriggerRef}
                className="location-dropdown-trigger"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              >
                <span className="location-dropdown-text">切换地区</span>
                <span className={`location-dropdown-arrow ${isLocationDropdownOpen ? 'open' : ''}`}>▼</span>
              </div>
              {isLocationDropdownOpen && createPortal(
                <div
                  ref={locationDropdownRef}
                  className="location-dropdown"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    zIndex: 99999,
                    WebkitBackfaceVisibility: 'hidden',
                    WebkitTransform: 'translateZ(0)'
                  }}
                >
                  {locations.map(location => (
                    <div
                      key={location.id}
                      className={`location-dropdown-item ${currentLocation?.id === location.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentLocation(location);
                        setIsLocationDropdownOpen(false);
                      }}
                    >
                      <span className="location-dropdown-name">
                        {location.name}
                        {location.is_default && <span className="default-badge-dropdown">默认</span>}
                      </span>
                      {locations.length > 1 && (
                        <button
                          className="btn-delete-location-dropdown"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id);
                            setIsLocationDropdownOpen(false);
                          }}
                          title="删除"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
        <div className="location-actions">
          <button
            className="btn-custom-profile"
            onClick={() => navigate('/settings')}
            title="私人定制"
          >
            私人定制
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
