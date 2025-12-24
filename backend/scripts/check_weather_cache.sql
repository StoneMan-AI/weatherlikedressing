-- 检查天气数据缓存和定时任务执行情况
-- 使用方法：psql -U username -d database_name -f check_weather_cache.sql

-- ============================================
-- 1. 查看天气数据缓存表的基本信息
-- ============================================
SELECT 
  '天气数据缓存表统计' AS info,
  COUNT(*) AS total_records,
  COUNT(DISTINCT latitude || ',' || longitude) AS unique_locations,
  MIN(last_updated) AS oldest_update,
  MAX(last_updated) AS latest_update
FROM weather_data_cache;

-- ============================================
-- 2. 查看最近的天气数据更新记录（最近10条）
-- ============================================
SELECT 
  id,
  latitude,
  longitude,
  timezone,
  last_updated,
  next_update_time,
  CASE 
    WHEN next_update_time > NOW() THEN '待更新'
    WHEN next_update_time <= NOW() THEN '已过期'
    ELSE '未设置'
  END AS update_status,
  EXTRACT(EPOCH FROM (NOW() - last_updated))/3600 AS hours_since_update
FROM weather_data_cache
ORDER BY last_updated DESC
LIMIT 10;

-- ============================================
-- 3. 检查需要更新的缓存（已过期）
-- ============================================
SELECT 
  COUNT(*) AS expired_cache_count,
  COUNT(DISTINCT latitude || ',' || longitude) AS expired_locations
FROM weather_data_cache
WHERE next_update_time <= NOW() OR last_updated < NOW() - INTERVAL '12 hours';

-- ============================================
-- 4. 查看活跃地区表（10天内用户请求过的地区）
-- ============================================
SELECT 
  '活跃地区统计' AS info,
  COUNT(*) AS total_active_regions,
  MIN(last_requested_at) AS oldest_request,
  MAX(last_requested_at) AS latest_request
FROM active_regions
WHERE last_requested_at >= NOW() - INTERVAL '10 days';

-- ============================================
-- 5. 查看最近的活跃地区（最近10条）
-- ============================================
SELECT 
  id,
  latitude,
  longitude,
  timezone,
  last_requested_at,
  request_count,
  EXTRACT(EPOCH FROM (NOW() - last_requested_at))/3600 AS hours_since_request
FROM active_regions
WHERE last_requested_at >= NOW() - INTERVAL '10 days'
ORDER BY last_requested_at DESC
LIMIT 10;

-- ============================================
-- 6. 检查活跃地区是否有对应的天气缓存
-- ============================================
SELECT 
  ar.latitude,
  ar.longitude,
  ar.timezone,
  ar.last_requested_at AS region_last_request,
  wc.last_updated AS cache_last_update,
  CASE 
    WHEN wc.id IS NULL THEN '无缓存'
    WHEN wc.last_updated < NOW() - INTERVAL '12 hours' THEN '缓存过期'
    ELSE '缓存有效'
  END AS cache_status
FROM active_regions ar
LEFT JOIN weather_data_cache wc 
  ON ROUND(ar.latitude::numeric, 4) = ROUND(wc.latitude::numeric, 4)
  AND ROUND(ar.longitude::numeric, 4) = ROUND(wc.longitude::numeric, 4)
  AND ar.timezone = wc.timezone
WHERE ar.last_requested_at >= NOW() - INTERVAL '10 days'
ORDER BY ar.last_requested_at DESC
LIMIT 20;

-- ============================================
-- 7. 查看天气请求日志（最近24小时）
-- ============================================
SELECT 
  '天气请求日志统计（最近24小时）' AS info,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN source = 'cache' THEN 1 END) AS cache_hits,
  COUNT(CASE WHEN source = 'api' THEN 1 END) AS api_calls,
  COUNT(DISTINCT latitude || ',' || longitude) AS unique_locations
FROM weather_requests
WHERE requested_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 8. 查看最近的天气请求日志（最近20条）
-- ============================================
SELECT 
  id,
  latitude,
  longitude,
  timezone,
  source,
  requested_at,
  EXTRACT(EPOCH FROM (NOW() - requested_at))/60 AS minutes_ago
FROM weather_requests
ORDER BY requested_at DESC
LIMIT 20;

-- ============================================
-- 9. 检查定时任务应该更新的地区（基于活跃地区）
-- ============================================
SELECT 
  ar.latitude,
  ar.longitude,
  ar.timezone,
  ar.last_requested_at,
  wc.last_updated,
  wc.next_update_time,
  CASE 
    WHEN wc.next_update_time <= NOW() THEN '需要立即更新'
    WHEN wc.last_updated < NOW() - INTERVAL '12 hours' THEN '缓存过期，需要更新'
    ELSE '缓存有效'
  END AS action_required
FROM active_regions ar
LEFT JOIN weather_data_cache wc 
  ON ROUND(ar.latitude::numeric, 4) = ROUND(wc.latitude::numeric, 4)
  AND ROUND(ar.longitude::numeric, 4) = ROUND(wc.longitude::numeric, 4)
  AND ar.timezone = wc.timezone
WHERE ar.last_requested_at >= NOW() - INTERVAL '10 days'
  AND (wc.next_update_time <= NOW() OR wc.last_updated < NOW() - INTERVAL '12 hours' OR wc.id IS NULL)
ORDER BY ar.last_requested_at DESC;

