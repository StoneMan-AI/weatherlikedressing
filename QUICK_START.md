# 快速开始指南

## 5分钟快速启动

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 配置数据库

确保 PostgreSQL 已安装并运行：

```bash
# 创建数据库
createdb weather_dressing

# 初始化表结构
psql -d weather_dressing -f ../schema_postgres.sql
```

### 3. 配置环境变量

在 `backend` 目录创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_dressing
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
JWT_SECRET=临时密钥，生产环境请更改
```

### 4. 启动服务

**终端1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端2 - 启动前端：**
```bash
cd frontend
npm run dev
```

### 5. 访问应用

- 🌐 前端：http://localhost:5173
- 🔧 后端API：http://localhost:3000
- ❤️ 健康检查：http://localhost:3000/health

### 6. 测试账号

1. 打开前端页面 http://localhost:5173
2. 点击"注册"创建账号（可用手机号或邮箱）
3. 登录后添加地点（在设置页面）
4. 返回首页查看穿衣推荐

## 常见问题

### 数据库连接失败

- 检查 PostgreSQL 是否运行：`sudo systemctl status postgresql`
- 检查数据库用户名和密码是否正确
- 检查数据库是否存在：`psql -l`

### 端口被占用

- 后端端口（3000）：修改 `backend/.env` 中的 `PORT`
- 前端端口（5173）：修改 `frontend/vite.config.js` 中的 `server.port`

### 天气API无数据

- Open-Meteo 是免费服务，通常不需要API密钥
- 如果请求失败，检查网络连接
- 可以稍后重试，可能是API服务暂时不可用

## 下一步

- 查看 [README.md](README.md) 了解完整功能
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解生产环境部署
- 查看 `dressing_rules_v1.json` 了解规则引擎配置
