-- 预置常用城市数据
-- 用于在网络不通时提供基础的城市搜索功能
-- 执行此SQL前，请确保 city_geocoding_cache 表已创建

-- 使用 INSERT ... ON CONFLICT DO NOTHING 避免重复插入
-- 如果城市已存在，则跳过（基于 city_name, latitude, longitude 的唯一约束）

-- ============================================
-- 中国主要城市（直辖市、省会城市、重要城市）
-- ============================================

-- 直辖市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('北京', '北京, 中国', 39.9042, 116.4074, 'Asia/Shanghai', 'CN', '中国', '北京', 100, NOW(), NOW(), NOW()),
  ('上海', '上海, 中国', 31.2304, 121.4737, 'Asia/Shanghai', 'CN', '中国', '上海', 100, NOW(), NOW(), NOW()),
  ('天津', '天津, 中国', 39.3434, 117.3616, 'Asia/Shanghai', 'CN', '中国', '天津', 100, NOW(), NOW(), NOW()),
  ('重庆', '重庆, 中国', 29.5630, 106.5516, 'Asia/Shanghai', 'CN', '中国', '重庆', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 广东省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('广州', '广州, 中国', 23.1291, 113.2644, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('深圳', '深圳, 中国', 22.5431, 114.0579, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('珠海', '珠海, 中国', 22.2707, 113.5767, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('佛山', '佛山, 中国', 23.0215, 113.1214, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('东莞', '东莞, 中国', 23.0207, 113.7518, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('中山', '中山, 中国', 22.5170, 113.3824, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('惠州', '惠州, 中国', 23.1118, 114.4158, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('汕头', '汕头, 中国', 23.3541, 116.6819, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 江苏省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('南京', '南京, 中国', 32.0603, 118.7969, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('苏州', '苏州, 中国', 31.2989, 120.5853, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('无锡', '无锡, 中国', 31.4912, 120.3124, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('常州', '常州, 中国', 31.8107, 119.9739, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('徐州', '徐州, 中国', 34.2042, 117.2859, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('南通', '南通, 中国', 31.9802, 120.8943, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('扬州', '扬州, 中国', 32.3932, 119.4129, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW()),
  ('镇江', '镇江, 中国', 32.1878, 119.4548, 'Asia/Shanghai', 'CN', '中国', '江苏', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 浙江省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('杭州', '杭州, 中国', 30.2741, 120.1551, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('宁波', '宁波, 中国', 29.8683, 121.5440, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('温州', '温州, 中国', 28.0004, 120.6994, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('嘉兴', '嘉兴, 中国', 30.7627, 120.7500, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('湖州', '湖州, 中国', 30.8930, 120.0858, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('绍兴', '绍兴, 中国', 29.9970, 120.5820, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('金华', '金华, 中国', 29.0790, 119.6474, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('台州', '台州, 中国', 28.6564, 121.4208, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 山东省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('济南', '济南, 中国', 36.6512, 117.1201, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('青岛', '青岛, 中国', 36.0671, 120.3826, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('烟台', '烟台, 中国', 37.4638, 121.4479, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('潍坊', '潍坊, 中国', 36.7069, 119.1617, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('临沂', '临沂, 中国', 35.0518, 118.3264, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('淄博', '淄博, 中国', 36.8135, 118.0549, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('济宁', '济宁, 中国', 35.4149, 116.5872, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW()),
  ('泰安', '泰安, 中国', 36.2002, 117.1201, 'Asia/Shanghai', 'CN', '中国', '山东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 四川省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('成都', '成都, 中国', 30.6624, 104.0633, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('绵阳', '绵阳, 中国', 31.4678, 104.6790, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('德阳', '德阳, 中国', 31.1268, 104.3980, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('南充', '南充, 中国', 30.8373, 106.1107, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('宜宾', '宜宾, 中国', 28.7519, 104.6432, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('自贡', '自贡, 中国', 29.3390, 104.7784, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('乐山', '乐山, 中国', 29.5521, 103.7657, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW()),
  ('泸州', '泸州, 中国', 28.8717, 105.4433, 'Asia/Shanghai', 'CN', '中国', '四川', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 湖北省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('武汉', '武汉, 中国', 30.5928, 114.3055, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('宜昌', '宜昌, 中国', 30.6919, 111.2865, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('襄阳', '襄阳, 中国', 32.0089, 112.1224, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('荆州', '荆州, 中国', 30.3349, 112.2384, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('黄石', '黄石, 中国', 30.1990, 115.0385, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('十堰', '十堰, 中国', 32.6294, 110.7980, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('孝感', '孝感, 中国', 30.9245, 113.9169, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW()),
  ('荆门', '荆门, 中国', 31.0354, 112.1993, 'Asia/Shanghai', 'CN', '中国', '湖北', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 河南省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('郑州', '郑州, 中国', 34.7466, 113.6254, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('洛阳', '洛阳, 中国', 34.6197, 112.4540, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('新乡', '新乡, 中国', 35.3030, 113.9268, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('南阳', '南阳, 中国', 32.9908, 112.5283, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('商丘', '商丘, 中国', 34.4142, 115.6505, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('安阳', '安阳, 中国', 36.1034, 114.3525, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('平顶山', '平顶山, 中国', 33.7662, 113.1927, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW()),
  ('焦作', '焦作, 中国', 35.2154, 113.2418, 'Asia/Shanghai', 'CN', '中国', '河南', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 湖南省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('长沙', '长沙, 中国', 28.2278, 112.9388, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('株洲', '株洲, 中国', 27.8270, 113.1339, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('湘潭', '湘潭, 中国', 27.8297, 112.9440, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('衡阳', '衡阳, 中国', 26.8967, 112.5719, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('岳阳', '岳阳, 中国', 29.3572, 113.1289, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('常德', '常德, 中国', 29.0314, 111.6985, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('益阳', '益阳, 中国', 28.5539, 112.3550, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW()),
  ('郴州', '郴州, 中国', 25.7731, 113.0147, 'Asia/Shanghai', 'CN', '中国', '湖南', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 陕西省
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('西安', '西安, 中国', 34.3416, 108.9398, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('宝鸡', '宝鸡, 中国', 34.3619, 107.2379, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('咸阳', '咸阳, 中国', 34.3333, 108.7100, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('渭南', '渭南, 中国', 34.4998, 109.4897, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('汉中', '汉中, 中国', 33.0770, 107.0233, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('延安', '延安, 中国', 36.5965, 109.4897, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('榆林', '榆林, 中国', 38.2532, 109.7346, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW()),
  ('安康', '安康, 中国', 32.6903, 109.0293, 'Asia/Shanghai', 'CN', '中国', '陕西', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 其他重要城市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  -- 福建省
  ('福州', '福州, 中国', 26.0745, 119.2965, 'Asia/Shanghai', 'CN', '中国', '福建', 100, NOW(), NOW(), NOW()),
  ('厦门', '厦门, 中国', 24.4798, 118.0819, 'Asia/Shanghai', 'CN', '中国', '福建', 100, NOW(), NOW(), NOW()),
  ('泉州', '泉州, 中国', 24.9089, 118.5859, 'Asia/Shanghai', 'CN', '中国', '福建', 100, NOW(), NOW(), NOW()),
  -- 安徽省
  ('合肥', '合肥, 中国', 31.8206, 117.2272, 'Asia/Shanghai', 'CN', '中国', '安徽', 100, NOW(), NOW(), NOW()),
  ('芜湖', '芜湖, 中国', 31.3263, 118.3764, 'Asia/Shanghai', 'CN', '中国', '安徽', 100, NOW(), NOW(), NOW()),
  ('蚌埠', '蚌埠, 中国', 32.9406, 117.3632, 'Asia/Shanghai', 'CN', '中国', '安徽', 100, NOW(), NOW(), NOW()),
  -- 江西省
  ('南昌', '南昌, 中国', 28.6820, 115.8579, 'Asia/Shanghai', 'CN', '中国', '江西', 100, NOW(), NOW(), NOW()),
  ('九江', '九江, 中国', 29.7050, 115.9928, 'Asia/Shanghai', 'CN', '中国', '江西', 100, NOW(), NOW(), NOW()),
  ('赣州', '赣州, 中国', 25.8290, 114.9338, 'Asia/Shanghai', 'CN', '中国', '江西', 100, NOW(), NOW(), NOW()),
  -- 河北省
  ('石家庄', '石家庄, 中国', 38.0428, 114.5149, 'Asia/Shanghai', 'CN', '中国', '河北', 100, NOW(), NOW(), NOW()),
  ('唐山', '唐山, 中国', 39.6309, 118.1802, 'Asia/Shanghai', 'CN', '中国', '河北', 100, NOW(), NOW(), NOW()),
  ('保定', '保定, 中国', 38.8510, 115.4903, 'Asia/Shanghai', 'CN', '中国', '河北', 100, NOW(), NOW(), NOW()),
  -- 辽宁省
  ('沈阳', '沈阳, 中国', 41.8057, 123.4315, 'Asia/Shanghai', 'CN', '中国', '辽宁', 100, NOW(), NOW(), NOW()),
  ('大连', '大连, 中国', 38.9140, 121.6147, 'Asia/Shanghai', 'CN', '中国', '辽宁', 100, NOW(), NOW(), NOW()),
  ('鞍山', '鞍山, 中国', 41.1085, 122.9946, 'Asia/Shanghai', 'CN', '中国', '辽宁', 100, NOW(), NOW(), NOW()),
  -- 吉林省
  ('长春', '长春, 中国', 43.8171, 125.3235, 'Asia/Shanghai', 'CN', '中国', '吉林', 100, NOW(), NOW(), NOW()),
  ('吉林', '吉林, 中国', 43.8436, 126.5496, 'Asia/Shanghai', 'CN', '中国', '吉林', 100, NOW(), NOW(), NOW()),
  -- 黑龙江省
  ('哈尔滨', '哈尔滨, 中国', 45.7731, 126.6238, 'Asia/Shanghai', 'CN', '中国', '黑龙江', 100, NOW(), NOW(), NOW()),
  ('大庆', '大庆, 中国', 46.5876, 125.1031, 'Asia/Shanghai', 'CN', '中国', '黑龙江', 100, NOW(), NOW(), NOW()),
  -- 云南省
  ('昆明', '昆明, 中国', 25.0389, 102.7183, 'Asia/Shanghai', 'CN', '中国', '云南', 100, NOW(), NOW(), NOW()),
  ('大理', '大理, 中国', 25.6065, 100.2676, 'Asia/Shanghai', 'CN', '中国', '云南', 100, NOW(), NOW(), NOW()),
  ('丽江', '丽江, 中国', 26.8550, 100.2277, 'Asia/Shanghai', 'CN', '中国', '云南', 100, NOW(), NOW(), NOW()),
  -- 贵州省
  ('贵阳', '贵阳, 中国', 26.6470, 106.6302, 'Asia/Shanghai', 'CN', '中国', '贵州', 100, NOW(), NOW(), NOW()),
  ('遵义', '遵义, 中国', 27.7050, 106.9370, 'Asia/Shanghai', 'CN', '中国', '贵州', 100, NOW(), NOW(), NOW()),
  -- 广西壮族自治区
  ('南宁', '南宁, 中国', 22.8170, 108.3669, 'Asia/Shanghai', 'CN', '中国', '广西', 100, NOW(), NOW(), NOW()),
  ('桂林', '桂林, 中国', 25.2345, 110.1799, 'Asia/Shanghai', 'CN', '中国', '广西', 100, NOW(), NOW(), NOW()),
  ('柳州', '柳州, 中国', 24.3146, 109.4281, 'Asia/Shanghai', 'CN', '中国', '广西', 100, NOW(), NOW(), NOW()),
  -- 海南省
  ('海口', '海口, 中国', 20.0444, 110.1999, 'Asia/Shanghai', 'CN', '中国', '海南', 100, NOW(), NOW(), NOW()),
  ('三亚', '三亚, 中国', 18.2528, 109.5119, 'Asia/Shanghai', 'CN', '中国', '海南', 100, NOW(), NOW(), NOW()),
  -- 新疆维吾尔自治区
  ('乌鲁木齐', '乌鲁木齐, 中国', 43.8256, 87.6168, 'Asia/Urumqi', 'CN', '中国', '新疆', 100, NOW(), NOW(), NOW()),
  -- 西藏自治区
  ('拉萨', '拉萨, 中国', 29.6626, 91.1160, 'Asia/Shanghai', 'CN', '中国', '西藏', 100, NOW(), NOW(), NOW()),
  -- 内蒙古自治区
  ('呼和浩特', '呼和浩特, 中国', 40.8414, 111.7519, 'Asia/Shanghai', 'CN', '中国', '内蒙古', 100, NOW(), NOW(), NOW()),
  ('包头', '包头, 中国', 40.6562, 109.8342, 'Asia/Shanghai', 'CN', '中国', '内蒙古', 100, NOW(), NOW(), NOW()),
  -- 宁夏回族自治区
  ('银川', '银川, 中国', 38.4872, 106.2309, 'Asia/Shanghai', 'CN', '中国', '宁夏', 100, NOW(), NOW(), NOW()),
  -- 青海省
  ('西宁', '西宁, 中国', 36.6171, 101.7782, 'Asia/Shanghai', 'CN', '中国', '青海', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- ============================================
-- 国际主要城市
-- ============================================

-- 美国
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('New York', 'New York, USA', 40.7128, -74.0060, 'America/New_York', 'US', 'United States', 'New York', 100, NOW(), NOW(), NOW()),
  ('Los Angeles', 'Los Angeles, USA', 34.0522, -118.2437, 'America/Los_Angeles', 'US', 'United States', 'California', 100, NOW(), NOW(), NOW()),
  ('Chicago', 'Chicago, USA', 41.8781, -87.6298, 'America/Chicago', 'US', 'United States', 'Illinois', 100, NOW(), NOW(), NOW()),
  ('Houston', 'Houston, USA', 29.7604, -95.3698, 'America/Chicago', 'US', 'United States', 'Texas', 100, NOW(), NOW(), NOW()),
  ('Phoenix', 'Phoenix, USA', 33.4484, -112.0740, 'America/Phoenix', 'US', 'United States', 'Arizona', 100, NOW(), NOW(), NOW()),
  ('Philadelphia', 'Philadelphia, USA', 39.9526, -75.1652, 'America/New_York', 'US', 'United States', 'Pennsylvania', 100, NOW(), NOW(), NOW()),
  ('San Antonio', 'San Antonio, USA', 29.4241, -98.4936, 'America/Chicago', 'US', 'United States', 'Texas', 100, NOW(), NOW(), NOW()),
  ('San Diego', 'San Diego, USA', 32.7157, -117.1611, 'America/Los_Angeles', 'US', 'United States', 'California', 100, NOW(), NOW(), NOW()),
  ('Dallas', 'Dallas, USA', 32.7767, -96.7970, 'America/Chicago', 'US', 'United States', 'Texas', 100, NOW(), NOW(), NOW()),
  ('San Jose', 'San Jose, USA', 37.3382, -121.8863, 'America/Los_Angeles', 'US', 'United States', 'California', 100, NOW(), NOW(), NOW()),
  ('San Francisco', 'San Francisco, USA', 37.7749, -122.4194, 'America/Los_Angeles', 'US', 'United States', 'California', 100, NOW(), NOW(), NOW()),
  ('Seattle', 'Seattle, USA', 47.6062, -122.3321, 'America/Los_Angeles', 'US', 'United States', 'Washington', 100, NOW(), NOW(), NOW()),
  ('Boston', 'Boston, USA', 42.3601, -71.0589, 'America/New_York', 'US', 'United States', 'Massachusetts', 100, NOW(), NOW(), NOW()),
  ('Miami', 'Miami, USA', 25.7617, -80.1918, 'America/New_York', 'US', 'United States', 'Florida', 100, NOW(), NOW(), NOW()),
  ('Las Vegas', 'Las Vegas, USA', 36.1699, -115.1398, 'America/Los_Angeles', 'US', 'United States', 'Nevada', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 欧洲
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('London', 'London, UK', 51.5074, -0.1278, 'Europe/London', 'GB', 'United Kingdom', 'England', 100, NOW(), NOW(), NOW()),
  ('Paris', 'Paris, France', 48.8566, 2.3522, 'Europe/Paris', 'FR', 'France', 'Île-de-France', 100, NOW(), NOW(), NOW()),
  ('Berlin', 'Berlin, Germany', 52.5200, 13.4050, 'Europe/Berlin', 'DE', 'Germany', 'Berlin', 100, NOW(), NOW(), NOW()),
  ('Madrid', 'Madrid, Spain', 40.4168, -3.7038, 'Europe/Madrid', 'ES', 'Spain', 'Madrid', 100, NOW(), NOW(), NOW()),
  ('Rome', 'Rome, Italy', 41.9028, 12.4964, 'Europe/Rome', 'IT', 'Italy', 'Lazio', 100, NOW(), NOW(), NOW()),
  ('Amsterdam', 'Amsterdam, Netherlands', 52.3676, 4.9041, 'Europe/Amsterdam', 'NL', 'Netherlands', 'North Holland', 100, NOW(), NOW(), NOW()),
  ('Vienna', 'Vienna, Austria', 48.2082, 16.3738, 'Europe/Vienna', 'AT', 'Austria', 'Vienna', 100, NOW(), NOW(), NOW()),
  ('Brussels', 'Brussels, Belgium', 50.8503, 4.3517, 'Europe/Brussels', 'BE', 'Belgium', 'Brussels', 100, NOW(), NOW(), NOW()),
  ('Zurich', 'Zurich, Switzerland', 47.3769, 8.5417, 'Europe/Zurich', 'CH', 'Switzerland', 'Zurich', 100, NOW(), NOW(), NOW()),
  ('Stockholm', 'Stockholm, Sweden', 59.3293, 18.0686, 'Europe/Stockholm', 'SE', 'Sweden', 'Stockholm', 100, NOW(), NOW(), NOW()),
  ('Copenhagen', 'Copenhagen, Denmark', 55.6761, 12.5683, 'Europe/Copenhagen', 'DK', 'Denmark', 'Capital Region', 100, NOW(), NOW(), NOW()),
  ('Oslo', 'Oslo, Norway', 59.9139, 10.7522, 'Europe/Oslo', 'NO', 'Norway', 'Oslo', 100, NOW(), NOW(), NOW()),
  ('Helsinki', 'Helsinki, Finland', 60.1699, 24.9384, 'Europe/Helsinki', 'FI', 'Finland', 'Uusimaa', 100, NOW(), NOW(), NOW()),
  ('Dublin', 'Dublin, Ireland', 53.3498, -6.2603, 'Europe/Dublin', 'IE', 'Ireland', 'Dublin', 100, NOW(), NOW(), NOW()),
  ('Prague', 'Prague, Czech Republic', 50.0755, 14.4378, 'Europe/Prague', 'CZ', 'Czech Republic', 'Prague', 100, NOW(), NOW(), NOW()),
  ('Warsaw', 'Warsaw, Poland', 52.2297, 21.0122, 'Europe/Warsaw', 'PL', 'Poland', 'Masovian', 100, NOW(), NOW(), NOW()),
  ('Budapest', 'Budapest, Hungary', 47.4979, 19.0402, 'Europe/Budapest', 'HU', 'Hungary', 'Budapest', 100, NOW(), NOW(), NOW()),
  ('Athens', 'Athens, Greece', 37.9838, 23.7275, 'Europe/Athens', 'GR', 'Greece', 'Attica', 100, NOW(), NOW(), NOW()),
  ('Lisbon', 'Lisbon, Portugal', 38.7223, -9.1393, 'Europe/Lisbon', 'PT', 'Portugal', 'Lisbon', 100, NOW(), NOW(), NOW()),
  ('Moscow', 'Moscow, Russia', 55.7558, 37.6173, 'Europe/Moscow', 'RU', 'Russia', 'Moscow', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 亚洲（除中国）
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('Tokyo', 'Tokyo, Japan', 35.6762, 139.6503, 'Asia/Tokyo', 'JP', 'Japan', 'Tokyo', 100, NOW(), NOW(), NOW()),
  ('Osaka', 'Osaka, Japan', 34.6937, 135.5023, 'Asia/Tokyo', 'JP', 'Japan', 'Osaka', 100, NOW(), NOW(), NOW()),
  ('Kyoto', 'Kyoto, Japan', 35.0116, 135.7681, 'Asia/Tokyo', 'JP', 'Japan', 'Kyoto', 100, NOW(), NOW(), NOW()),
  ('Yokohama', 'Yokohama, Japan', 35.4437, 139.6380, 'Asia/Tokyo', 'JP', 'Japan', 'Kanagawa', 100, NOW(), NOW(), NOW()),
  ('Seoul', 'Seoul, South Korea', 37.5665, 126.9780, 'Asia/Seoul', 'KR', 'South Korea', 'Seoul', 100, NOW(), NOW(), NOW()),
  ('Busan', 'Busan, South Korea', 35.1796, 129.0756, 'Asia/Seoul', 'KR', 'South Korea', 'Busan', 100, NOW(), NOW(), NOW()),
  ('Singapore', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore', 'SG', 'Singapore', NULL, 100, NOW(), NOW(), NOW()),
  ('Bangkok', 'Bangkok, Thailand', 13.7563, 100.5018, 'Asia/Bangkok', 'TH', 'Thailand', 'Bangkok', 100, NOW(), NOW(), NOW()),
  ('Kuala Lumpur', 'Kuala Lumpur, Malaysia', 3.1390, 101.6869, 'Asia/Kuala_Lumpur', 'MY', 'Malaysia', 'Kuala Lumpur', 100, NOW(), NOW(), NOW()),
  ('Jakarta', 'Jakarta, Indonesia', -6.2088, 106.8456, 'Asia/Jakarta', 'ID', 'Indonesia', 'Jakarta', 100, NOW(), NOW(), NOW()),
  ('Manila', 'Manila, Philippines', 14.5995, 120.9842, 'Asia/Manila', 'PH', 'Philippines', 'Metro Manila', 100, NOW(), NOW(), NOW()),
  ('Ho Chi Minh City', 'Ho Chi Minh City, Vietnam', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh', 'VN', 'Vietnam', 'Ho Chi Minh City', 100, NOW(), NOW(), NOW()),
  ('Hanoi', 'Hanoi, Vietnam', 21.0285, 105.8542, 'Asia/Ho_Chi_Minh', 'VN', 'Vietnam', 'Hanoi', 100, NOW(), NOW(), NOW()),
  ('New Delhi', 'New Delhi, India', 28.6139, 77.2090, 'Asia/Kolkata', 'IN', 'India', 'Delhi', 100, NOW(), NOW(), NOW()),
  ('Mumbai', 'Mumbai, India', 19.0760, 72.8777, 'Asia/Kolkata', 'IN', 'India', 'Maharashtra', 100, NOW(), NOW(), NOW()),
  ('Bangalore', 'Bangalore, India', 12.9716, 77.5946, 'Asia/Kolkata', 'IN', 'India', 'Karnataka', 100, NOW(), NOW(), NOW()),
  ('Dubai', 'Dubai, UAE', 25.2048, 55.2708, 'Asia/Dubai', 'AE', 'United Arab Emirates', 'Dubai', 100, NOW(), NOW(), NOW()),
  ('Abu Dhabi', 'Abu Dhabi, UAE', 24.4539, 54.3773, 'Asia/Dubai', 'AE', 'United Arab Emirates', 'Abu Dhabi', 100, NOW(), NOW(), NOW()),
  ('Tel Aviv', 'Tel Aviv, Israel', 32.0853, 34.7818, 'Asia/Jerusalem', 'IL', 'Israel', 'Tel Aviv', 100, NOW(), NOW(), NOW()),
  ('Istanbul', 'Istanbul, Turkey', 41.0082, 28.9784, 'Europe/Istanbul', 'TR', 'Turkey', 'Istanbul', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 中国特别行政区及台湾
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('Hong Kong', 'Hong Kong, China', 22.3193, 114.1694, 'Asia/Hong_Kong', 'HK', 'Hong Kong', NULL, 100, NOW(), NOW(), NOW()),
  ('Macau', 'Macau, China', 22.1987, 113.5439, 'Asia/Macau', 'MO', 'Macau', NULL, 100, NOW(), NOW(), NOW()),
  ('Taipei', 'Taipei, Taiwan', 25.0330, 121.5654, 'Asia/Taipei', 'TW', 'Taiwan', 'Taipei', 100, NOW(), NOW(), NOW()),
  ('Kaohsiung', 'Kaohsiung, Taiwan', 22.6273, 120.3014, 'Asia/Taipei', 'TW', 'Taiwan', 'Kaohsiung', 100, NOW(), NOW(), NOW()),
  ('Taichung', 'Taichung, Taiwan', 24.1477, 120.6736, 'Asia/Taipei', 'TW', 'Taiwan', 'Taichung', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 大洋洲
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('Sydney', 'Sydney, Australia', -33.8688, 151.2093, 'Australia/Sydney', 'AU', 'Australia', 'New South Wales', 100, NOW(), NOW(), NOW()),
  ('Melbourne', 'Melbourne, Australia', -37.8136, 144.9631, 'Australia/Melbourne', 'AU', 'Australia', 'Victoria', 100, NOW(), NOW(), NOW()),
  ('Brisbane', 'Brisbane, Australia', -27.4698, 153.0251, 'Australia/Brisbane', 'AU', 'Australia', 'Queensland', 100, NOW(), NOW(), NOW()),
  ('Perth', 'Perth, Australia', -31.9505, 115.8605, 'Australia/Perth', 'AU', 'Australia', 'Western Australia', 100, NOW(), NOW(), NOW()),
  ('Adelaide', 'Adelaide, Australia', -34.9285, 138.6007, 'Australia/Adelaide', 'AU', 'Australia', 'South Australia', 100, NOW(), NOW(), NOW()),
  ('Auckland', 'Auckland, New Zealand', -36.8485, 174.7633, 'Pacific/Auckland', 'NZ', 'New Zealand', 'Auckland', 100, NOW(), NOW(), NOW()),
  ('Wellington', 'Wellington, New Zealand', -41.2865, 174.7762, 'Pacific/Auckland', 'NZ', 'New Zealand', 'Wellington', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 南美洲
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('São Paulo', 'São Paulo, Brazil', -23.5505, -46.6333, 'America/Sao_Paulo', 'BR', 'Brazil', 'São Paulo', 100, NOW(), NOW(), NOW()),
  ('Rio de Janeiro', 'Rio de Janeiro, Brazil', -22.9068, -43.1729, 'America/Sao_Paulo', 'BR', 'Brazil', 'Rio de Janeiro', 100, NOW(), NOW(), NOW()),
  ('Buenos Aires', 'Buenos Aires, Argentina', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires', 'AR', 'Argentina', 'Buenos Aires', 100, NOW(), NOW(), NOW()),
  ('Lima', 'Lima, Peru', -12.0464, -77.0428, 'America/Lima', 'PE', 'Peru', 'Lima', 100, NOW(), NOW(), NOW()),
  ('Bogotá', 'Bogotá, Colombia', 4.7110, -74.0721, 'America/Bogota', 'CO', 'Colombia', 'Bogotá', 100, NOW(), NOW(), NOW()),
  ('Santiago', 'Santiago, Chile', -33.4489, -70.6693, 'America/Santiago', 'CL', 'Chile', 'Santiago', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 非洲
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('Cairo', 'Cairo, Egypt', 30.0444, 31.2357, 'Africa/Cairo', 'EG', 'Egypt', 'Cairo', 100, NOW(), NOW(), NOW()),
  ('Johannesburg', 'Johannesburg, South Africa', -26.2041, 28.0473, 'Africa/Johannesburg', 'ZA', 'South Africa', 'Gauteng', 100, NOW(), NOW(), NOW()),
  ('Cape Town', 'Cape Town, South Africa', -33.9249, 18.4241, 'Africa/Johannesburg', 'ZA', 'South Africa', 'Western Cape', 100, NOW(), NOW(), NOW()),
  ('Lagos', 'Lagos, Nigeria', 6.5244, 3.3792, 'Africa/Lagos', 'NG', 'Nigeria', 'Lagos', 100, NOW(), NOW(), NOW()),
  ('Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, 'Africa/Nairobi', 'KE', 'Kenya', 'Nairobi', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 加拿大
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('Toronto', 'Toronto, Canada', 43.6532, -79.3832, 'America/Toronto', 'CA', 'Canada', 'Ontario', 100, NOW(), NOW(), NOW()),
  ('Vancouver', 'Vancouver, Canada', 49.2827, -123.1207, 'America/Vancouver', 'CA', 'Canada', 'British Columbia', 100, NOW(), NOW(), NOW()),
  ('Montreal', 'Montreal, Canada', 45.5017, -73.5673, 'America/Montreal', 'CA', 'Canada', 'Quebec', 100, NOW(), NOW(), NOW()),
  ('Calgary', 'Calgary, Canada', 51.0447, -114.0719, 'America/Edmonton', 'CA', 'Canada', 'Alberta', 100, NOW(), NOW(), NOW()),
  ('Ottawa', 'Ottawa, Canada', 45.4215, -75.6972, 'America/Toronto', 'CA', 'Canada', 'Ontario', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 添加注释说明
COMMENT ON TABLE city_geocoding_cache IS '城市地理编码缓存表，包含预置常用城市数据，用于在网络不通时提供基础搜索功能';

