/**
 * 用户追踪服务
 * 记录匿名用户和已登录用户的行为
 */

const pool = require('../config/database');

class UserTrackingService {
  /**
   * 记录或更新匿名用户
   */
  async trackAnonymousUser(anonymousUserId, userAgent = null, ipAddress = null) {
    try {
      await pool.query(
        `INSERT INTO anonymous_users 
         (anonymous_user_id, first_seen_at, last_seen_at, request_count, user_agent, ip_address)
         VALUES ($1, now(), now(), 1, $2, $3)
         ON CONFLICT (anonymous_user_id)
         DO UPDATE SET 
           last_seen_at = now(),
           request_count = anonymous_users.request_count + 1`,
        [anonymousUserId, userAgent, ipAddress]
      );
    } catch (error) {
      // 如果表不存在，忽略错误
      if (error.code !== '42P01') {
        console.warn('Failed to track anonymous user:', error.message);
      }
    }
  }

  /**
   * 记录用户请求
   */
  async trackUserRequest(userId, anonymousUserId, requestType, latitude = null, longitude = null, metadata = {}) {
    try {
      await pool.query(
        `INSERT INTO user_requests 
         (anonymous_user_id, authenticated_user_id, request_type, latitude, longitude, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          anonymousUserId || null,
          userId || null,
          requestType,
          latitude,
          longitude,
          JSON.stringify(metadata)
        ]
      );
    } catch (error) {
      // 如果表不存在，忽略错误
      if (error.code !== '42P01') {
        console.warn('Failed to track user request:', error.message);
      }
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId, anonymousUserId) {
    try {
      const result = await pool.query(
        `SELECT 
           COUNT(*) as total_requests,
           COUNT(DISTINCT latitude || ',' || longitude) as unique_locations,
           MIN(requested_at) as first_request,
           MAX(requested_at) as last_request
         FROM user_requests
         WHERE ($1::bigint IS NOT NULL AND authenticated_user_id = $1)
            OR ($2::varchar IS NOT NULL AND anonymous_user_id = $2)`,
        [userId || null, anonymousUserId || null]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.warn('Failed to get user stats:', error.message);
      return null;
    }
  }
}

module.exports = UserTrackingService;

