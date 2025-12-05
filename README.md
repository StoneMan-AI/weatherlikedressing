# 智能穿衣指导应用

> 基于规则的智能穿衣推荐系统，支持中国大陆和海外用户，提供高颗粒度穿衣推荐、健康提示和最简电商功能。

## 功能特性

- 🌤️ **实时天气数据**：集成 Open-Meteo 和 AQI 空气质量数据
- 👔 **智能穿衣推荐**：基于规则引擎的舒适度计算和穿衣层级推荐
- 🏥 **健康提醒**：针对特殊天气条件的健康风险提示
- 👤 **个性化设置**：支持年龄、体质敏感度、健康状况等个性化配置
- 🛍️ **最简电商**：商品浏览和订单管理（仅限中国大陆用户）
- 📱 **响应式设计**：明亮卡片式UI，适配移动端和桌面端
- 🌍 **多地点支持**：用户可以保存多个地点并快速切换

## 技术栈

### 后端
- **Node.js** + **Express**：RESTful API 服务器
- **PostgreSQL**：关系型数据库
- **JWT**：用户认证
- **bcryptjs**：密码加密
- **Axios**：HTTP 客户端（调用天气API）

### 前端
- **React 18**：UI 框架
- **Vite**：构建工具
- **React Router**：路由管理
- **TanStack Query**：数据获取和状态管理
- **Axios**：API 调用

## 项目结构

```
weather/
├── backend/                 # 后端代码
│   ├── config/             # 配置文件
│   │   └── database.js     # 数据库连接
│   ├── routes/             # API 路由
│   │   ├── users.js        # 用户管理
│   │   ├── weather.js      # 天气数据
│   │   ├── recommendations.js  # 穿衣推荐
│   │   ├── products.js     # 商品管理
│   │   ├── orders.js       # 订单管理
│   │   └── locations.js    # 地点管理
│   ├── services/           # 业务逻辑
│   │   ├── ruleEngine.js   # 规则引擎核心
│   │   └── weatherService.js  # 天气服务
│   ├── server.js           # 服务器入口
│   └── package.json
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── contexts/       # Context API
│   │   ├── pages/          # 页面组件
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── dressing_rules_v1.json  # 规则引擎配置
├── schema_postgres.sql     # 数据库表结构
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
cd weather
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **配置数据库**

创建 PostgreSQL 数据库：
```bash
createdb weather_dressing
```

执行数据库初始化脚本：
```bash
psql -d weather_dressing -f schema_postgres.sql
```

4. **配置环境变量**

在 `backend` 目录下创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_dressing
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key_change_in_production

# 可选：AQI API 密钥
AIRVISUAL_API_KEY=your_airvisual_api_key
```

5. **启动开发服务器**

```bash
# 终端1：启动后端服务器
cd backend
npm run dev

# 终端2：启动前端开发服务器
cd frontend
npm run dev
```

6. **访问应用**

- 前端：http://localhost:5173
- 后端API：http://localhost:3300

## API 文档

### 用户认证

#### 注册
```
POST /api/users/register
Body: {
  mobile?: string,
  email?: string,
  password: string,
  language?: 'zh-CN' | 'en',
  country_code?: string
}
```

#### 登录
```
POST /api/users/login
Body: {
  mobile?: string,
  email?: string,
  password: string
}
```

### 天气数据

#### 获取当前天气
```
GET /api/weather/current?latitude=31.2304&longitude=121.4737&timezone=Asia/Shanghai
```

#### 获取天气预报
```
GET /api/weather/forecast?latitude=31.2304&longitude=121.4737&timezone=Asia/Shanghai&hours=48
```

### 穿衣推荐

#### 计算推荐
```
POST /api/recommendations/calculate
Headers: { Authorization: 'Bearer <token>' }
Body: {
  latitude: number,
  longitude: number,
  timezone?: string,
  is_outdoor?: boolean,
  activity_level?: 'low' | 'moderate' | 'high',
  user_profile?: object,
  target_time?: string
}
```

### 地点管理

#### 获取地点列表
```
GET /api/locations
Headers: { Authorization: 'Bearer <token>' }
```

#### 添加地点
```
POST /api/locations
Headers: { Authorization: 'Bearer <token>' }
Body: {
  name: string,
  latitude: number,
  longitude: number,
  timezone?: string,
  is_default?: boolean
}
```

### 商品管理

#### 获取商品列表
```
GET /api/products?category=&page=1&limit=20&country_code=
```

#### 获取商品详情
```
GET /api/products/:id
```

### 订单管理

#### 创建订单
```
POST /api/orders
Headers: { Authorization: 'Bearer <token>' }
Body: {
  items: [
    {
      product_id: number,
      qty: number
    }
  ]
}
```

#### 获取订单列表
```
GET /api/orders?page=1&limit=20&status=
Headers: { Authorization: 'Bearer <token>' }
```

## 规则引擎

规则引擎基于 JSON 配置文件（`dressing_rules_v1.json`）工作，主要包含：

- **输入参数**：温度、湿度、风速、紫外线、AQI 等
- **权重配置**：各项因素的计算权重
- **用户画像调整**：年龄、敏感度、健康状况的影响
- **计算规则**：舒适度分数的计算公式
- **层级映射**：舒适度分数到穿衣建议的映射
- **健康规则**：特殊天气条件的健康提醒

## 数据库设计

核心表结构：
- `users`：用户信息
- `locations`：用户保存的地点
- `weather_cache`：天气数据缓存
- `recommendations`：推荐历史记录
- `products`：商品信息
- `orders`：订单信息
- `order_items`：订单项
- `config_rules`：规则配置
- `push_logs`：推送日志

详细表结构见 `schema_postgres.sql`。

## 部署

### 生产环境部署

1. **后端部署**
   - 使用 PM2 或类似的进程管理器
   - 配置环境变量
   - 确保数据库连接正常

2. **前端部署**
   ```bash
   cd frontend
   npm run build
   # 将 dist 目录部署到静态文件服务器（如 Nginx）
   ```

3. **数据库备份**
   - 定期备份 PostgreSQL 数据库
   - 建议使用 pg_dump

### Docker 部署（可选）

可以创建 Dockerfile 和 docker-compose.yml 进行容器化部署。

## 开发指南

### 添加新的规则

修改 `dressing_rules_v1.json` 文件，然后重启后端服务。

### 自定义样式

前端样式定义在：
- `frontend/src/index.css`：全局样式和 CSS 变量
- 各组件目录下的 `.css` 文件：组件样式

主题色彩可在 `index.css` 的 `:root` 中修改。

## 注意事项

1. **天气API限制**：Open-Meteo 是免费服务，但可能有请求频率限制
2. **AQI数据**：需要配置 AirVisual API 密钥才能获取真实的空气质量数据
3. **安全性**：生产环境务必更改 JWT_SECRET，使用 HTTPS
4. **数据库**：建议定期备份，使用连接池管理连接

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 Issue 或联系开发团队。
