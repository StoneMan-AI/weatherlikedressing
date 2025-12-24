-- 城市地理编码缓存表
-- 用于缓存用户搜索过的城市地理编码数据，避免重复调用OpenStreetMap API

CREATE TABLE IF NOT EXISTS city_geocoding_cache (
  id BIGSERIAL PRIMARY KEY,
  city_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(512),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
  country_code VARCHAR(8),
  country_name VARCHAR(128),
  state VARCHAR(128),
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- 创建索引以提高搜索性能
  CONSTRAINT unique_city_location UNIQUE (city_name, latitude, longitude)
);

-- 创建索引以支持模糊搜索
CREATE INDEX IF NOT EXISTS idx_city_name ON city_geocoding_cache(city_name);
CREATE INDEX IF NOT EXISTS idx_city_name_lower ON city_geocoding_cache(LOWER(city_name));
CREATE INDEX IF NOT EXISTS idx_display_name ON city_geocoding_cache(display_name);
CREATE INDEX IF NOT EXISTS idx_last_searched ON city_geocoding_cache(last_searched_at DESC);

-- 创建用于模糊匹配的文本搜索索引（使用GIN索引支持ILIKE查询）
-- 注意：对于简单的ILIKE查询，B-tree索引已经足够，这里使用表达式索引
CREATE INDEX IF NOT EXISTS idx_city_name_pattern ON city_geocoding_cache(city_name text_pattern_ops);

-- 添加注释
COMMENT ON TABLE city_geocoding_cache IS '城市地理编码缓存表，存储用户搜索过的城市地理编码数据';
COMMENT ON COLUMN city_geocoding_cache.city_name IS '城市名称（用户搜索的关键词）';
COMMENT ON COLUMN city_geocoding_cache.display_name IS '完整显示名称（来自OpenStreetMap）';
COMMENT ON COLUMN city_geocoding_cache.search_count IS '该城市被搜索的次数';
COMMENT ON COLUMN city_geocoding_cache.last_searched_at IS '最后搜索时间';

