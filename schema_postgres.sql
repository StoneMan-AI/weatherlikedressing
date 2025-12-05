-- users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  mobile VARCHAR(20),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  language VARCHAR(10) DEFAULT 'zh-CN',
  country_code VARCHAR(8),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  profile_json JSONB,
  membership_status VARCHAR(32) DEFAULT 'free',
  push_pref_json JSONB DEFAULT '{}'::jsonb
);

-- locations
CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(128),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone VARCHAR(64),
  is_default BOOLEAN DEFAULT false
);

-- weather_cache
CREATE TABLE weather_cache (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT REFERENCES locations(id) ON DELETE CASCADE,
  source VARCHAR(64),
  raw_payload JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ
);

-- recommendations
CREATE TABLE recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  location_id BIGINT REFERENCES locations(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ,
  input_snapshot JSONB,
  comfort_score NUMERIC,
  recommendation_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(64) UNIQUE,
  title_cn VARCHAR(255),
  title_en VARCHAR(255),
  description_cn TEXT,
  description_en TEXT,
  price_cny NUMERIC(10,2),
  stock_qty INTEGER DEFAULT 0,
  weight_g INTEGER,
  thumbnail_url TEXT,
  category VARCHAR(64),
  shipping_exclude_overseas BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- orders
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  order_no VARCHAR(64) UNIQUE,
  total_amount_cny NUMERIC(10,2),
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- order_items
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  sku VARCHAR(64),
  qty INTEGER,
  unit_price NUMERIC(10,2)
);

-- config_rules
CREATE TABLE config_rules (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128),
  version VARCHAR(32),
  config_json JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- push_logs
CREATE TABLE push_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  push_type VARCHAR(64),
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_flag BOOLEAN DEFAULT false
);
