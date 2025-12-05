# 穿衣指导 App — 规则引擎 JSON、数据库设计、系统架构与交付清单

> 目标：为中国大陆为主、兼顾海外用户，提供基于规则的“高颗粒度穿衣推荐 + 健康提示 + 最简电商”应用。支持离线模式。UI 基调：明亮卡片式（选项 A）。

---
## 交付物概览
1. **规则引擎 JSON（可直接部署）** — 包含 ComfortScore 计算、体质修正、阈值与输出模板。  
2. **数据库设计** — 用户/天气缓存/商品/订单/配置等核心表结构。  
3. **系统架构说明** — 中国/海外/离线三模切换、API 层、规则引擎位置、推送服务、最小电商流。  
4. **推送策略配置表** — 可直接作为后台规则表导入。  
5. **UI 指南与卡片式界面草案说明**（文案示例、主要页面构成）
6. **天气 API 调用模板（Open-Meteo + 空气质量补充）**

---
## 1) 规则引擎 JSON（示例）
下面的 JSON 为可执行配置示例（键名可直接用于前端/后端规则引擎），带注释说明（注释在实际 JSON 中需移除或用 `_comment` 字段）

```json
{
  "meta": {
    "version": "1.0",
    "created": "2025-12-04",
    "notes": "基于规则的体感计算与穿衣层映射，适配中国/海外/离线。"
  },
  "inputs": ["temperature_c","relative_humidity","wind_m_s","uv_index","precip_prob","aqi","is_outdoor","activity_level","user_profile"],

  "weights": {
    "base_temp_reference": 15,
    "temp_multiplier": 2.0,
    "wind_threshold_mps": 1.5,
    "wind_multiplier": 3.0,
    "sun_score_default": 3.0,
    "humidity_multiplier_cold": 1.2,
    "humidity_multiplier_hot": 0.8
  },

  "user_profile_adjustments": {
    "age_groups": {"child_0_2": -6, "child_3_6": -4, "adult": 0, "elderly_65_plus": -3},
    "sensitivity": {"cold": -8, "hot": 8},
    "conditions": {"rheumatism": -3, "asthma": 0}
  },

  "compute": {
    "T_score": "(temperature_c - base_temp_reference) * temp_multiplier",
    "RH_score": "if(temperature_c <= 15, -((relative_humidity - 50)/10) * humidity_multiplier_cold, ((relative_humidity - 50)/10) * humidity_multiplier_hot)",
    "Wind_score": "if(wind_m_s <= wind_threshold_mps, 0, - (wind_m_s - wind_threshold_mps) * wind_multiplier)",
    "Sun_score": "if(is_outdoor and uv_index >= 3, sun_score_default, 0)",
    "Activity_adj": "if(activity_level == 'low', 0, if(activity_level=='moderate', 2, 5))",
    "User_adj": "sum of applicable user_profile adjustments (age + sensitivity + conditions)",
    "ComfortScore": "T_score + RH_score + Wind_score + Sun_score + Activity_adj + User_adj"
  },

  "mappings": {
    "layers": [
      {"min_score": 12, "label": "warm_light", "layers": ["短袖/薄长袖","无需中层","轻薄外套（可选）"], "accessories": ["太阳镜/帽（若UV高）"]},
      {"min_score": 3, "label": "mild","layers": ["薄长袖","轻毛衣","夹克/薄羽绒"], "accessories": ["薄围巾（建议）"]},
      {"min_score": -7, "label": "cool","layers": ["保暖打底","羊毛衫/抓绒","软壳/羽绒外套"], "accessories": ["围巾/手套"]},
      {"min_score": -20, "label": "cold","layers": ["保暖内衣/羊毛打底","羊毛衫+羽绒马甲","中厚羽绒服"], "accessories": ["帽子/手套/保暖袜"]},
      {"min_score": -999, "label": "extreme_cold","layers": ["全套厚羽绒+功能性保暖内衣"], "accessories": ["减少外出/高风险提示"]}
    ]
  },

  "health_rules": [
    {"id": "cold_wind_risk", "condition": "temperature_c <= 5 && wind_m_s >= 5", "message": "低温且大风，感冒和呼吸道感染风险上升，建议戴口罩/围巾并减少外出"},
    {"id": "damp_rheumatism_risk", "condition": "relative_humidity >= 70 && temperature_c <= 12", "message": "湿冷天气，可能诱发风湿/关节不适，建议防潮保暖"},
    {"id": "high_uv_risk", "condition": "uv_index >= 6 && is_outdoor", "message": "紫外线强，建议全面防晒并避免中午外出"},
    {"id": "aqi_sensitive", "condition": "aqi >= 151", "message": "空气质量不佳，敏感人群减少户外活动并佩戴口罩"}
  ],

  "push_triggers": [
    {"id":"next_day_push","type":"scheduled","time":"user_preferred_evening","payload":"compute next-day 08:00 recommendation"},
    {"id":"temp_drop","type":"delta","metric":"temperature_c","window_hours":24,"threshold":5,"direction":"decrease","payload":"气温骤降提醒"},
    {"id":"humidity_jump","type":"delta","metric":"relative_humidity","window_hours":3,"threshold":20,"payload":"湿度骤增提醒"},
    {"id":"wind_increase","type":"delta","metric":"wind_m_s","window_hours":3,"threshold":3,"min_value":6,"payload":"风力突增提醒"},
    {"id":"extreme_weather","type":"api_flag","flag_keys":["severe_alert"],"payload":"极端天气高优先通知"}
  ],

  "output_template": {
    "comfort_score": "{ComfortScore}",
    "recommendation_layers": "{layers}",
    "accessories": "{accessories}",
    "reason_summary": "计算明细：T_score={T_score}, RH_score={RH_score}, Wind_score={Wind_score}, User_adj={User_adj}",
    "health_messages": ["applied health_rules messages"]
  }
}
```

---
## 2) 数据库核心设计（关系型，便于国产云与私有化部署）
> 采用 PostgreSQL（或 MySQL）作为主 DB；Redis 作为缓存（天气缓存、推送去重、session）。

### A. `users`（用户表）
- id (PK)
- mobile (nullable)
- email (nullable)
- password_hash (nullable)
- language ("zh-CN" / "en")
- country_code
- created_at
- last_login
- profile_json (存储年龄、体质标签、慢性病、偏好，如{"age":68,"sensitivity":"cold","conditions":["rheumatism"]})
- membership_status
- push_pref_json (用户推送偏好)

### B. `locations`（用户保存的地点）
- id, user_id, name (如“家/父母家/学校”), lat, lon, timezone, is_default

### C. `weather_cache`（天气缓存表）
- id, location_id, source (open-meteo / heweather), raw_payload (json), fetched_at, valid_until

### D. `recommendations`（历史穿衣建议，用于回溯与个性化）
- id, user_id, location_id, timestamp, input_snapshot(json), comfort_score, recommendation_json, created_at

### E. `products`（商品表）
- id, sku, title_cn, title_en, description_cn, description_en, price_cny, stock_qty, weight_g, thumbnail_url, category, shipping_exclude_overseas (bool)

### F. `orders`（最简订单表）
- id, user_id, order_no, total_amount_cny, status (pending/paid/shipped/delivered/cancelled), created_at, updated_at

### G. `order_items`
- id, order_id, product_id, sku, qty, unit_price

### H. `config_rules`（可在线下发的规则配置）
- id, name, version, config_json, enabled, created_at

### I. `push_logs`（去重与审计）
- id, user_id, push_type, payload, sent_at, delivered_flag

---
## 3) 系统架构（高层）

- **前端（Flutter）**：Android + Web（单一代码库），本地规则引擎模块（用于离线）和网络模块
- **后端（云）**：Node.js / Spring Boot（任选）提供：用户服务、商品订单服务、规则校正/配置下发服务、推送服务
- **天气聚合层**：后端调用 Open-Meteo（主）与 IQAir（AQI）并缓存到 Redis/Postgres；国内用户可选性地优先调用和风。
- **规则引擎**：部署在后端（在线计算）并把配置下发给前端（用于离线计算）。前端在联网时拉取最新规则 JSON（`config_rules`），并在无网时使用本地缓存的规则与天气缓存计算建议。
- **推送服务**：后端按 `push_triggers` 规则对比天气变更与用户偏好，调用 APNs / FCM / 华为/小米推送等。Mobile Web 使用浏览器 Push（需用户许可）。


---
## 4) 推送策略配置表（示例）
> 可直接作为后台表配置，前端订阅触发条件。字段：id | trigger_type | metric | condition | threshold | window_hours | default_enabled

| id | trigger_type | metric | condition | threshold | window_hours | default_enabled |
|----|--------------|--------|-----------|-----------:|-------------:|----------------:|
| temp_drop | delta | temperature_c | decrease >= | 5 | 24 | true |
| humidity_jump | delta | relative_humidity | increase >= | 20 | 3 | true |
| wind_rise | delta | wind_m_s | increase & >= | 3 (min 6) | 3 | true |
| next_day | scheduled | - | - | - | - | true |
| extreme | api_flag | severe_alert | any | - | - | true |

---
## 5) UI 指南（卡片式，明亮）
- 主色调：#FF7A59（暖珊瑚）为强调色，辅助色 #FFD9CC（暖背景），文字用深灰 #333333。卡片圆角 12px，间距充足，字号偏大（适合老人）。
- 字体：系统自带或思源黑体/思源宋体混用（中文可读性好）。
- 主要页面：
  1. 首页卡片：当前体感（大号数值+图标），核心穿衣建议（1 行简短） + 展开查看“详细层级”（点击展开显示具体衣物）。
  2. 次日预览卡：简短建议 + 切换 AM/PM
  3. 健康提醒卡：高优先级以红色小条显示（可点开阅读详细原因）
  4. 多地点切换（下拉或横向滑动卡）
  5. 购物入口卡（仅对中国用户显示）：商品轮播 + 快速下单按钮
  6. 个人设置：体质偏好、家庭组、推送偏好、语言切换

- 文案风格示例（温暖亲民）：
  - 当前："体感：偏冷（-8）"
  - 推荐："羊毛打底衫 + 羊毛衫 + 羽绒服 + 加厚裤 + 围巾"
  - 理由（副文本）: "低温 + 大风 + 湿冷 → 建议全身保暖，外出时间尽量缩短"

---
## 6) 最简电商流程（仅中国大陆）
- 商品浏览（商品卡） -> 加入购物车 -> 结算 -> 支付（接入微信/支付宝） -> 产生订单（status=paid） -> 后端发货（手动/ERP 接口） -> 用户查询物流。
- 说明：你已说明“不考虑物流”，所以系统仅提供订单记录与支付能力，发货可由运维/人工处理（或后续接入第三方物流 API）。

---
## 7) 天气 API 调用示例（Open-Meteo）
> 简单的 GET 请求举例（实际部署应在后端代理，避免暴露 API 细节）

**示例：查询小时级气温/湿度/风/uv（Open-Meteo）**
```
GET https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&hourly=temperature_2m,relativehumidity_2m,wind_speed_10m,uv_index,precipitation_probability&timezone=Asia/Shanghai
```
**返回要点**：小时数组 temperature_2m[], relativehumidity_2m[], wind_speed_10m[], uv_index[], precipitation_probability[]。

**AQI 补充（示例：IQAir / AirVisual）**
```
GET https://api.airvisual.com/v2/nearest_city?lat=31.2304&lon=121.4737&key=YOUR_KEY
```

---
## 8) 离线策略（关键点）
- 前端本地缓存：最后一次天气（小时级）+ 最后一次规则 JSON + 最近一次 recommendations（24 小时）
- 离线 UI：顶部显示“当前离线，以下为最近更新（时间）”并禁用实时推送触发器。
- 当网络恢复时自动同步：拉取最新规则与天气并重新计算并展示“已更新”小提示。

---
## 9) 隐私与合规（简要）
- 明示隐私条款：说明定位/手机号/健康偏好用途
- 健康建议带免责声明："本应用提供生活建议，不作为医疗诊断。出现严重症状请就医。"
- 因涉及老年/儿童用户，移动端注册/推送需额外注意运营合规与未成年人保护政策。

---
## 10) 下一步交付（我可以直接生成）
请选择你希望我**立刻生成**的具体一个或多个文件（我将把它放到一个单独文档里，便于下载）：

- [ ] 规则引擎 **完整 JSON 文件**（可直接放到后端/前端规则库）
- [ ] 完整 **数据库建表 SQL（Postgres）**
- [ ] **API 文档（OpenAPI/Swagger）草案**（包含天气聚合、用户、订单、推荐接口）
- [ ] **UI 高保真内容示例**（文案、配色、关键页的详细卡片文案）

请用复选方式回复，例如：`规则JSON + 建表SQL` 或 `全部`。我会直接生成并把文件放在这里供你下载。

