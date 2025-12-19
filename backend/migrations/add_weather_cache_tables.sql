-- 天气数据缓存表（按坐标存储，不依赖location_id）
CREATE TABLE IF NOT EXISTS weather_data_cache (
  id BIGSERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
  weather_data JSONB NOT NULL, -- 存储完整的天气数据（包含15天预报）
  aqi INTEGER,
  aqi_status VARCHAR(32),
  last_updated TIMESTAMPTZ DEFAULT now(),
  next_update_time TIMESTAMPTZ, -- 下次更新时间（0时或12时）
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(latitude, longitude, timezone)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_weather_cache_coords ON weather_data_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_cache_update_time ON weather_data_cache(next_update_time);

-- 活跃地区表（记录10天内用户请求过的地区）
CREATE TABLE IF NOT EXISTS active_regions (
  id BIGSERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
  last_requested_at TIMESTAMPTZ DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(latitude, longitude, timezone)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_active_regions_coords ON active_regions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_active_regions_last_requested ON active_regions(last_requested_at);

-- 天气请求日志表（用于追踪用户请求）
CREATE TABLE IF NOT EXISTS weather_requests (
  id BIGSERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone VARCHAR(64),
  requested_at TIMESTAMPTZ DEFAULT now(),
  source VARCHAR(32) DEFAULT 'cache' -- 'cache' or 'api'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_weather_requests_coords ON weather_requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_requests_time ON weather_requests(requested_at);

