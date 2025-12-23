/**
 * 用户ID工具函数
 * 生成并管理匿名用户的唯一标识
 */

/**
 * 生成或获取用户ID
 * 如果localStorage中已有用户ID，则返回；否则生成新的UUID并保存
 */
export function getOrCreateUserId() {
  let userId = localStorage.getItem('userId');
  
  if (!userId) {
    // 生成UUID v4格式的用户ID
    userId = generateUUID();
    localStorage.setItem('userId', userId);
  }
  
  return userId;
}

/**
 * 生成UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 获取用户ID（不创建新的）
 */
export function getUserId() {
  return localStorage.getItem('userId');
}

/**
 * 清除用户ID
 */
export function clearUserId() {
  localStorage.removeItem('userId');
  localStorage.removeItem('sessionId');
}

/**
 * 获取用户标识（用于axios拦截器）
 * 返回 { userId, sessionId }
 */
export function getUserIdentifier() {
  const userId = getOrCreateUserId();
  
  // 生成或获取会话ID
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  
  return { userId, sessionId };
}
