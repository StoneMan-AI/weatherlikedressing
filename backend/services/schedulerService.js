/**
 * 定时任务服务
 * 负责在0时和12时更新活跃地区的天气数据
 */

const WeatherCacheService = require('./weatherCacheService');

class SchedulerService {
  constructor() {
    this.weatherCacheService = new WeatherCacheService();
    this.updateInterval = null;
  }

  /**
   * 计算到下一个更新时间（0时或12时）的延迟（毫秒）
   */
  getDelayUntilNextUpdate() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    
    let nextUpdate = new Date(now);
    
    if (hour < 12) {
      // 如果当前时间在0-12点之间，下次更新时间为12时
      nextUpdate.setHours(12, 0, 0, 0);
    } else {
      // 如果当前时间在12-24点之间，下次更新时间为次日0时
      nextUpdate.setDate(nextUpdate.getDate() + 1);
      nextUpdate.setHours(0, 0, 0, 0);
    }
    
    const delay = nextUpdate.getTime() - now.getTime();
    return delay;
  }

  /**
   * 执行天气数据更新
   */
  async performWeatherUpdate() {
    try {
      console.log(`[${new Date().toISOString()}] Starting scheduled weather update...`);
      
      // 更新活跃地区的天气数据
      const result = await this.weatherCacheService.updateActiveRegionsWeather();
      
      console.log(`[${new Date().toISOString()}] Weather update completed:`, result);
      
      // 清理不活跃的地区
      await this.weatherCacheService.cleanupInactiveRegions();
      
      return result;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in scheduled weather update:`, error);
      throw error;
    }
  }

  /**
   * 启动定时任务
   */
  start() {
    console.log('Starting weather update scheduler...');
    
    // 立即执行一次（如果当前时间接近0时或12时）
    const delay = this.getDelayUntilNextUpdate();
    const hoursUntilUpdate = delay / (1000 * 60 * 60);
    
    console.log(`Next weather update scheduled in ${hoursUntilUpdate.toFixed(2)} hours`);
    
    // 设置第一次更新
    setTimeout(async () => {
      await this.performWeatherUpdate();
      
      // 之后每12小时更新一次
      this.updateInterval = setInterval(async () => {
        await this.performWeatherUpdate();
      }, 12 * 60 * 60 * 1000); // 12小时
    }, delay);
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Weather update scheduler stopped');
    }
  }

  /**
   * 手动触发更新（用于测试）
   */
  async triggerUpdate() {
    return await this.performWeatherUpdate();
  }
}

module.exports = SchedulerService;

