/**
 * Axios配置
 * 自动在所有请求中添加用户标识
 */
import axios from 'axios';
import { getUserIdentifier } from './userId';

// 配置axios请求拦截器，自动添加用户标识
axios.interceptors.request.use(
  (config) => {
    // 获取用户标识
    const { userId, sessionId } = getUserIdentifier();
    
    // 在请求头中添加用户标识
    config.headers['X-User-ID'] = userId;
    config.headers['X-Session-ID'] = sessionId;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 配置axios响应拦截器，处理错误
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response;
      
      // 可以根据不同的状态码进行不同的处理
      if (status === 401) {
        // 未授权，可能需要清除token
        console.warn('Unauthorized request');
      } else if (status >= 500) {
        // 服务器错误
        console.error('Server error:', data?.error || 'Internal server error');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('Network error:', error.message);
    } else {
      // 其他错误
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axios;

