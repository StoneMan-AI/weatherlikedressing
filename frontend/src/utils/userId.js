/**
 * 用户标识工具
 * 为每个用户（包括未登录用户）生成并管理唯一的匿名session ID
 */

const USER_ID_KEY = 'weather_app_user_id';
const SESSION_ID_KEY = 'weather_app_session_id';

/**
 * 生成唯一的用户ID
 * 格式: user_{timestamp}_{random}
 */
function generateUserId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `user_${timestamp}_${random}`;
}

/**
 * 生成会话ID（每次打开应用时生成新的）
 * 格式: session_{timestamp}_{random}
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session_${timestamp}_${random}`;
}

/**
 * 获取或创建用户ID
 * 用户ID在首次访问时创建，之后一直保持不变（除非清除localStorage）
 */
export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

/**
 * 获取或创建会话ID
 * 会话ID在每次打开应用时创建，用于跟踪单次会话
 */
export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * 清除用户ID（用于测试或重置）
 */
export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * 清除会话ID
 */
export function clearSessionId() {
  sessionStorage.removeItem(SESSION_ID_KEY);
}

/**
 * 获取完整的用户标识信息
 */
export function getUserIdentifier() {
  return {
    userId: getUserId(),
    sessionId: getSessionId()
  };
}

