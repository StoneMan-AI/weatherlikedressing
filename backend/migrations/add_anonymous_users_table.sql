-- 匿名用户表（用于追踪未登录用户）
CREATE TABLE IF NOT EXISTS anonymous_users (
  id BIGSERIAL PRIMARY KEY,
  anonymous_user_id VARCHAR(128) UNIQUE NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anonymous_users_id ON anonymous_users(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_users_last_seen ON anonymous_users(last_seen_at);

-- 用户请求统计表（可选，用于分析）
CREATE TABLE IF NOT EXISTS user_requests (
  id BIGSERIAL PRIMARY KEY,
  anonymous_user_id VARCHAR(128),
  authenticated_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(64) NOT NULL, -- 'weather', 'recommendation', etc.
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  requested_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_requests_anon_id ON user_requests(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_auth_id ON user_requests(authenticated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_type ON user_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_user_requests_time ON user_requests(requested_at);

