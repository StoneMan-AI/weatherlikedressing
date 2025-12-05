# 部署文档

## 生产环境部署指南

### 1. 服务器要求

- **操作系统**：Linux (Ubuntu 20.04+ / CentOS 7+)
- **Node.js**：>= 16.0.0
- **PostgreSQL**：>= 12.0
- **Nginx**：>= 1.18（用于反向代理和静态文件服务）
- **内存**：至少 2GB RAM
- **存储**：至少 10GB 可用空间

### 2. 数据库设置

#### 2.1 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
```

#### 2.2 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行
CREATE DATABASE weather_dressing;
CREATE USER weather_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE weather_dressing TO weather_user;
\q
```

#### 2.3 初始化数据库表

```bash
psql -U weather_user -d weather_dressing -f schema_postgres.sql
```

### 3. 后端部署

#### 3.1 安装 Node.js

```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3.2 部署应用代码

```bash
# 创建应用目录
sudo mkdir -p /var/www/weatherlikedressing
sudo chown $USER:$USER /var/www/weatherlikedressing

# 克隆或上传代码
cd /var/www/weatherlikedressing

# 安装依赖
cd backend
npm install --production

# 安装 PM2 进程管理器
sudo npm install -g pm2
```

#### 3.3 配置环境变量

创建 `/var/www/weatherlikedressing/backend/.env`：

```env
PORT=3300
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_dressing
DB_USER=postgres
DB_PASSWORD=12345

JWT_SECRET=sadjfhjk43879sdfkln34w8

AIRVISUAL_API_KEY=your_airvisual_api_key_if_available
```

**重要**：生成强随机的 JWT_SECRET：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3.4 启动后端服务

```bash
cd /var/www/weatherlikedressing/backend
pm2 start server.js --name weather-backend
pm2 save
pm2 startup  # 设置开机自启
```

#### 3.5 配置 Nginx 反向代理

创建 `/etc/nginx/sites-available/weatherlikedressing`：

```nginx
server {
    listen 80;
    server_name adddesigngroup.com www.adddesigngroup.com;

    # ⚠️ 重要：Let's Encrypt验证路径必须在最前面，不能重定向到index.html
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://localhost:3300/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # 静态资源缓存（必须在location /之前）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/weatherlikedressing/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 前端静态文件（SPA路由处理，放在最后）
    location / {
        root /var/www/weatherlikedressing/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # index.html不缓存
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # 日志配置
    access_log /var/log/nginx/weatherlikedressing-access.log;
    error_log /var/log/nginx/weatherlikedressing-error.log;
}
```

**⚠️ 重要提示：**
- `.well-known/acme-challenge/` 路径必须在最前面，用于Let's Encrypt SSL证书验证
- location块的顺序很重要，更具体的匹配应该在前面
- 必须创建certbot目录：`sudo mkdir -p /var/www/certbot && sudo chown -R www-data:www-data /var/www/certbot`

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/weatherlikedressing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 前端部署

#### 4.1 构建前端应用

```bash
cd /var/www/weatherlikedressing/frontend
npm install
npm run build
```

构建产物在 `dist/` 目录。

#### 4.2 更新 API 基础URL（如需要）

如果前端和后端不在同一域名，需要修改 `vite.config.js` 中的代理配置，或使用环境变量。

### 5. SSL/TLS 配置（推荐）

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 6. 防火墙配置

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许 SSH（如果还没有）
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable
```

### 7. 监控和日志

#### 7.1 PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs weather-backend

# 查看监控面板
pm2 monit
```

#### 7.2 Nginx 日志

- 访问日志：`/var/log/nginx/access.log`
- 错误日志：`/var/log/nginx/error.log`

### 8. 数据库备份

#### 8.1 创建备份脚本

创建 `/usr/local/bin/backup-weather-db.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/weather-dressing"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="weather_dressing_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U weather_user weather_dressing > $BACKUP_DIR/$FILENAME

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

#### 8.2 设置定时备份

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨2点备份
0 2 * * * /usr/local/bin/backup-weather-db.sh
```

### 9. 性能优化

#### 9.1 PostgreSQL 优化

编辑 `/etc/postgresql/*/main/postgresql.conf`：

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

重启 PostgreSQL：
```bash
sudo systemctl restart postgresql
```

#### 9.2 Node.js 优化

- 使用集群模式运行多个进程（如果需要）
- 配置适当的连接池大小
- 启用 gzip 压缩

### 10. 安全建议

1. **定期更新**：保持系统和依赖包更新
2. **强密码**：使用强密码策略
3. **防火墙**：仅开放必要端口
4. **HTTPS**：使用 SSL/TLS 加密
5. **日志监控**：定期检查日志文件
6. **备份**：定期备份数据库和应用代码
7. **权限控制**：使用最小权限原则

### 11. 故障排查

#### 后端无法启动
```bash
# 检查日志
pm2 logs weather-backend

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查环境变量
cd /var/www/weatherlikedressing/backend
cat .env
```

#### 数据库连接失败
```bash
# 测试连接
psql -U weather_user -d weather_dressing

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

#### Nginx 错误
```bash
# 检查配置语法
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 12. 更新部署

1. 备份当前版本
2. 拉取最新代码
3. 安装新依赖
4. 构建前端
5. 重启服务：`pm2 restart weather-backend`
6. 检查服务状态

### 13. 回滚

如果新版本有问题，可以回滚：

```bash
# 恢复代码
cd /var/www/weatherlikedressing
git checkout <previous-version>

# 重新安装依赖和构建
cd backend && npm install
cd ../frontend && npm install && npm run build

# 重启服务
pm2 restart weather-backend
```

## 联系支持

如遇问题，请检查日志文件或联系技术支持团队。
