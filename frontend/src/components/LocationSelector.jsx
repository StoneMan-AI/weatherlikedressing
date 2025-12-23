import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [cityName, setCityName] = useState('');
  const [searching, setSearching] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
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
    try {
      const location = await searchLocationByCityName(cityName.trim());
      const newLocation = addLocation(location);
      // 搜索成功后，自动切换到搜索到的地区
      if (newLocation) {
        setCurrentLocation(newLocation);
      }
      setCityName('');
      setShowAddForm(false);
    } catch (error) {
      alert('未找到该城市，请检查城市名称是否正确');
    } finally {
      setSearching(false);
    }
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
                    zIndex: 99999
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
            className="btn-travel-guide"
            onClick={() => {
              const travelSection = document.getElementById('travel-recommendation-section');
              if (travelSection) {
                travelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            title="旅行指南"
          >
            旅行指南
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
        <form onSubmit={handleSearchCity} className="add-location-form">
          <input
            type="text"
            className="city-search-input"
            placeholder="输入城市名称，如：北京、上海、New York"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
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
      )}
    </div>
  );
};

export default LocationSelector;
