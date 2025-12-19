import React, { useState, useRef, useEffect } from 'react';
import { useLocationContext } from '../contexts/LocationContext';
import './LocationSelector.css';

const LocationSelector = () => {
  const {
    locations,
    currentLocation,
    setCurrentLocation,
    addLocation,
    deleteLocation,
    searchLocationByCityName
  } = useLocationContext();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cityName, setCityName] = useState('');
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) {
      alert('请输入城市名称');
      return;
    }

    // 检查是否已达到最大数量
    if (locations.length >= 5) {
      alert('最多只能添加5个地区');
      return;
    }

    setSearching(true);
    try {
      const location = await searchLocationByCityName(cityName.trim());
      addLocation(location);
      setCityName('');
      setShowAddForm(false);
    } catch (error) {
      alert('未找到该城市，请检查城市名称是否正确');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteLocation = (id, e) => {
    e.stopPropagation();
    if (locations.length <= 1) {
      alert('至少需要保留一个位置');
      return;
    }
    if (confirm('确定要删除这个位置吗？')) {
      deleteLocation(id);
      setShowDropdown(false);
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="location-selector">
      <div className="location-header">
        <div className="location-current-wrapper">
          <h2 className="location-title">{currentLocation?.name || '选择位置'}</h2>
          {locations.length > 1 && (
            <button
              className="btn-dropdown"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="选择地区"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        <button
          className="btn-add-location"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowDropdown(false);
          }}
          disabled={locations.length >= 5}
          title={locations.length >= 5 ? '最多只能添加5个地区' : '添加地区'}
        >
          {showAddForm ? '取消' : '+'}
        </button>
      </div>

      {/* 下拉框 */}
      {showDropdown && locations.length > 1 && (
        <div className="location-dropdown" ref={dropdownRef}>
          {locations.map(location => (
            <div
              key={location.id}
              className={`dropdown-item ${currentLocation?.id === location.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentLocation(location);
                setShowDropdown(false);
              }}
            >
              <span className="dropdown-item-name">{location.name}</span>
              {location.is_default && <span className="default-badge">默认</span>}
              {locations.length > 1 && (
                <button
                  className="btn-delete-location"
                  onClick={(e) => handleDeleteLocation(location.id, e)}
                  title="删除地区"
                >
                  <span className="delete-icon">×</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSearchCity} className="add-location-form">
          <input
            type="text"
            className="city-search-input"
            placeholder="输入城市名称，如：北京、上海、New York"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={searching || locations.length >= 5}
          />
          <button
            type="submit"
            className="btn-search-city"
            disabled={searching || locations.length >= 5}
          >
            {searching ? '搜索中...' : '搜索'}
          </button>
          {locations.length >= 5 && (
            <p className="max-location-warning">已达到最大数量（5个）</p>
          )}
        </form>
      )}
    </div>
  );
};

export default LocationSelector;
