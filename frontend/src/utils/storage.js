/**
 * 存储工具 - 支持无痕模式的降级方案
 * 优先级：localStorage -> sessionStorage -> 内存存储
 */

class StorageManager {
  constructor() {
    this.memoryStorage = new Map();
    this.storageType = this.detectStorageType();
  }

  /**
   * 检测可用的存储类型
   */
  detectStorageType() {
    try {
      // 测试 localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return 'localStorage';
    } catch (e) {
      try {
        // 测试 sessionStorage
        const testKey = '__storage_test__';
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
        return 'sessionStorage';
      } catch (e2) {
        // 都不可用，使用内存存储
        console.warn('localStorage and sessionStorage are not available, using memory storage');
        return 'memory';
      }
    }
  }

  /**
   * 获取存储的值
   */
  getItem(key) {
    try {
      if (this.storageType === 'localStorage') {
        return localStorage.getItem(key);
      } else if (this.storageType === 'sessionStorage') {
        return sessionStorage.getItem(key);
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      // 降级到内存存储
      if (this.storageType !== 'memory') {
        this.storageType = 'memory';
        return this.memoryStorage.get(key) || null;
      }
      return null;
    }
  }

  /**
   * 设置存储的值
   */
  setItem(key, value) {
    try {
      if (this.storageType === 'localStorage') {
        localStorage.setItem(key, value);
      } else if (this.storageType === 'sessionStorage') {
        sessionStorage.setItem(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      // 如果存储满了，尝试清理并重试
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        try {
          // 尝试清理一些旧数据
          this.cleanupOldData();
          // 重试
          if (this.storageType === 'localStorage') {
            localStorage.setItem(key, value);
          } else if (this.storageType === 'sessionStorage') {
            sessionStorage.setItem(key, value);
          } else {
            this.memoryStorage.set(key, value);
          }
          return true;
        } catch (retryError) {
          // 如果还是失败，降级到内存存储
          console.warn('Storage quota exceeded, falling back to memory storage');
          this.storageType = 'memory';
          this.memoryStorage.set(key, value);
          return true;
        }
      }
      // 其他错误，降级到内存存储
      if (this.storageType !== 'memory') {
        this.storageType = 'memory';
        this.memoryStorage.set(key, value);
        return true;
      }
      return false;
    }
  }

  /**
   * 删除存储的值
   */
  removeItem(key) {
    try {
      if (this.storageType === 'localStorage') {
        localStorage.removeItem(key);
      } else if (this.storageType === 'sessionStorage') {
        sessionStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      if (this.storageType !== 'memory') {
        this.storageType = 'memory';
        this.memoryStorage.delete(key);
        return true;
      }
      return false;
    }
  }

  /**
   * 清理旧数据（当存储空间不足时）
   */
  cleanupOldData() {
    try {
      // 清理一些可能不再需要的键
      const keysToClean = [];
      for (let i = 0; i < (this.storageType === 'localStorage' ? localStorage : sessionStorage).length; i++) {
        const key = (this.storageType === 'localStorage' ? localStorage : sessionStorage).key(i);
        if (key && !key.startsWith('weather_') && !key.startsWith('token') && !key.startsWith('profile')) {
          keysToClean.push(key);
        }
      }
      keysToClean.forEach(key => {
        if (this.storageType === 'localStorage') {
          localStorage.removeItem(key);
        } else {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * 获取当前存储类型
   */
  getStorageType() {
    return this.storageType;
  }
}

// 创建单例实例
const storageManager = new StorageManager();

export default storageManager;

