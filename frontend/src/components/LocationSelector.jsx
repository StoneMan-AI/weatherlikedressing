import React from 'react';
import './LocationSelector.css';

const LocationSelector = ({ locations, selectedLocation, onSelectLocation }) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="location-selector card">
        <p className="text-gray">暂无地点，请前往设置添加</p>
      </div>
    );
  }

  return (
    <div className="location-selector card">
      <label className="location-label">选择地点：</label>
      <select
        value={selectedLocation?.id || ''}
        onChange={(e) => {
          const location = locations.find(loc => loc.id === parseInt(e.target.value));
          onSelectLocation(location);
        }}
        className="location-select"
      >
        {locations.map(location => (
          <option key={location.id} value={location.id}>
            {location.name} ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelector;
