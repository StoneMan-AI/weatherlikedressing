/**
 * 用户标识中间件
 * 从请求头中提取用户ID和会话ID，用于匿名用户跟踪
 */

/**
 * 用户标识中间件
 * 从请求头中提取 X-User-ID 和 X-Session-ID
 * 如果不存在，生成新的匿名ID（但不设置到响应中，由前端管理）
 */
function userIdMiddleware(req, res, next) {
  // 从请求头中获取用户标识
  const userId = req.headers['x-user-id'] || req.headers['X-User-ID'];
  const sessionId = req.headers['x-session-id'] || req.headers['X-Session-ID'];
  
  // 将用户标识添加到请求对象中
  req.anonymousUserId = userId || null;
  req.anonymousSessionId = sessionId || null;
  
  // 如果有登录用户，优先使用登录用户的ID
  req.userId = req.user?.id || req.anonymousUserId;
  
  // 记录用户访问（可选，用于分析）
  if (userId) {
    // 可以在这里记录用户访问日志
    // console.log(`User access: ${userId}, Session: ${sessionId}`);
  }
  
  next();
}

module.exports = userIdMiddleware;

