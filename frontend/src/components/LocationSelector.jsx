import React, { useState } from 'react';
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
  const [searchResults, setSearchResults] = useState(null); // 存储多个搜索结果

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

  const handleLocationChange = (e) => {
    const selectedLocationId = parseInt(e.target.value);
    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
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
            <div className="location-dropdown-wrapper">
              <select
                className="location-select"
                value={currentLocation?.id || ''}
                onChange={handleLocationChange}
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}{location.is_default ? ' (默认)' : ''}
                  </option>
                ))}
              </select>
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
