/**
 * PM2 Ecosystem 配置文件
 * 用于生产环境部署管理
 */

module.exports = {
  apps: [{
    name: 'weather-backend',
    script: './server.js',
    
    // 进程模式：fork 或 cluster
    // fork: 单进程模式（默认，适合当前应用）
    // cluster: 多进程模式（适合高并发，需要多核CPU）
    exec_mode: 'fork',  // 当前使用fork模式，如需cluster模式改为 'cluster' 并设置 instances
    
    // 实例数量
    // fork模式: 1 (单个进程)
    // cluster模式: 'max' (使用所有CPU核心) 或指定数字 (如 4)
    instances: 1,
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3300
    },
    
    // 开发环境变量（npm run dev时使用）
    env_development: {
      NODE_ENV: 'development',
      PORT: 3300
    },
    
    // 日志配置
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 自动重启
    autorestart: true,
    watch: false,  // 生产环境关闭文件监听
    
    // 内存限制（超过1G自动重启）
    max_memory_restart: '1G',
    
    // 等待就绪时间（毫秒）
    listen_timeout: 10000,
    
    // 优雅重启等待时间
    kill_timeout: 5000,
    
    // 最小运行时间（毫秒），防止频繁重启
    min_uptime: '10s',
    
    // 最大重启次数（1小时内）
    max_restarts: 10,
    
    // 重启延迟（毫秒）
    restart_delay: 4000
  }]
};

/**
 * 使用说明：
 * 
 * 1. Fork模式（当前配置，默认）：
 *    - 适合中小型应用
 *    - 单进程运行
 *    - 资源占用少
 *    - 启动：pm2 start ecosystem.config.js
 * 
 * 2. Cluster模式（高并发场景）：
 *    修改配置为：
 *    - exec_mode: 'cluster'
 *    - instances: 'max' 或数字（如 4）
 *    然后启动：pm2 start ecosystem.config.js
 * 
 * 3. 其他PM2命令：
 *    - pm2 stop weather-backend
 *    - pm2 restart weather-backend
 *    - pm2 reload weather-backend  # 零停机重载（cluster模式）
 *    - pm2 delete weather-backend
 *    - pm2 logs weather-backend
 *    - pm2 monit
 */








