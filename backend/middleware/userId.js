/**
 * 用户ID中间件
 * 从请求头中提取用户ID，如果没有则生成新的
 */

const UserTrackingService = require('../services/userTrackingService');
const userTrackingService = new UserTrackingService();

/**
 * 生成唯一ID
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `anon_${timestamp}_${random}${random2}`;
}

/**
 * 用户ID中间件
 * 从请求头 X-User-ID 中获取用户ID，如果没有则生成新的
 */
function userIdMiddleware(req, res, next) {
  // 从请求头获取用户ID（前端会在所有请求中自动添加）
  let anonymousUserId = req.headers['x-user-id'];
  
  // 如果请求头中没有，尝试从查询参数获取（用于某些特殊情况）
  if (!anonymousUserId) {
    anonymousUserId = req.query.user_id;
  }
  
  // 如果还是没有，生成一个新的匿名用户ID
  if (!anonymousUserId) {
    anonymousUserId = generateUniqueId();
  }
  
  // 将匿名用户ID添加到请求对象
  req.anonymousUserId = anonymousUserId;
  
  // 如果用户已登录，优先使用登录用户的ID
  if (req.user && req.user.id) {
    req.userId = req.user.id;
    req.isAuthenticated = true;
  } else {
    req.userId = null;
    req.isAuthenticated = false;
  }
  
  // 追踪匿名用户（异步，不阻塞请求）
  if (!req.isAuthenticated) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    // 异步执行，不阻塞请求
    setImmediate(() => {
      userTrackingService.trackAnonymousUser(anonymousUserId, userAgent, ipAddress).catch(() => {
        // 忽略错误，不影响主流程
      });
    });
  }
  
  // 在响应头中返回用户ID（用于前端确认）
  res.setHeader('X-User-ID', anonymousUserId);
  
  next();
}

module.exports = userIdMiddleware;

