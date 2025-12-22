import React, { useState } from 'react';
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

  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) {
      alert('请输入城市名称');
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

  const handleDeleteLocation = (id) => {
    if (locations.length <= 1) {
      alert('至少需要保留一个位置');
      return;
    }
    if (confirm('确定要删除这个位置吗？')) {
      deleteLocation(id);
    }
  };

  return (
    <div className="location-selector">
      <div className="location-header">
        <div className="location-title-section">
          <h2 className="location-title">{currentLocation?.name || '选择位置'}</h2>
          {locations.length > 1 && (
            <div className="location-list-horizontal">
              {locations.map(location => (
                <div
                  key={location.id}
                  className={`location-item-horizontal ${currentLocation?.id === location.id ? 'active' : ''}`}
                  onClick={() => setCurrentLocation(location)}
                  title={location.name}
                >
                  <span className="location-name-horizontal">{location.name}</span>
                  {location.is_default && <span className="default-badge-small">默认</span>}
                  {locations.length > 1 && (
                    <button
                      className="btn-delete-location-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(location.id);
                      }}
                      title="删除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn-add-location"
          onClick={() => setShowAddForm(!showAddForm)}
          title={showAddForm ? '取消添加' : '添加位置'}
        >
          {showAddForm ? '取消' : '+'}
        </button>
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
