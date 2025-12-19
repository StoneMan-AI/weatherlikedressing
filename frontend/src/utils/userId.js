/**
 * 用户标识工具
 * 为每个用户（包括未登录用户）生成并管理唯一标识
 */

/**
 * 生成唯一用户ID
 */
function generateUserId() {
  // 使用时间戳 + 随机数生成唯一ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${timestamp}_${random}`;
}

/**
 * 获取或创建用户ID
 * 如果localStorage中已有，则返回；否则创建新的并保存
 */
export function getOrCreateUserId() {
  const STORAGE_KEY = 'weather_user_id';
  
  try {
    let userId = localStorage.getItem(STORAGE_KEY);
    
    if (!userId) {
      // 首次访问，生成新的用户ID
      userId = generateUserId();
      localStorage.setItem(STORAGE_KEY, userId);
      
      // 记录创建时间
      localStorage.setItem(`${STORAGE_KEY}_created_at`, new Date().toISOString());
    }
    
    return userId;
  } catch (error) {
    console.error('Failed to get or create user ID:', error);
    // 如果localStorage不可用，使用临时ID（会话级别）
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * 获取用户ID（不创建新的）
 */
export function getUserId() {
  const STORAGE_KEY = 'weather_user_id';
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * 重置用户ID（用于测试或用户要求）
 */
export function resetUserId() {
  const STORAGE_KEY = 'weather_user_id';
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}_created_at`);
  return getOrCreateUserId();
}

/**
 * 获取用户ID创建时间
 */
export function getUserIdCreatedAt() {
  const STORAGE_KEY = 'weather_user_id';
  return localStorage.getItem(`${STORAGE_KEY}_created_at`);
}

