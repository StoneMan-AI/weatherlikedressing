-- 中国城市预置数据 - 第二部分：广东省
-- 包含：所有地级市及其下辖区县

-- ============================================
-- 广东省
-- ============================================

-- 广州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('广州', '广州, 中国', 23.1291, 113.2644, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('荔湾区', '荔湾区, 广州, 中国', 23.1250, 113.2430, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('越秀区', '越秀区, 广州, 中国', 23.1291, 113.2644, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('海珠区', '海珠区, 广州, 中国', 23.0833, 113.3178, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('天河区', '天河区, 广州, 中国', 23.1375, 113.3612, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('白云区', '白云区, 广州, 中国', 23.1579, 113.2732, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('黄埔区', '黄埔区, 广州, 中国', 23.1074, 113.4505, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('番禺区', '番禺区, 广州, 中国', 22.9386, 113.3846, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('花都区', '花都区, 广州, 中国', 23.3764, 113.2204, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('南沙区', '南沙区, 广州, 中国', 22.8016, 113.5254, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('从化区', '从化区, 广州, 中国', 23.5483, 113.5864, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('增城区', '增城区, 广州, 中国', 23.2905, 113.8106, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 深圳市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('深圳', '深圳, 中国', 22.5431, 114.0579, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('罗湖区', '罗湖区, 深圳, 中国', 22.5484, 114.1239, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('福田区', '福田区, 深圳, 中国', 22.5234, 114.0550, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('南山区', '南山区, 深圳, 中国', 22.5329, 113.9304, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('宝安区', '宝安区, 深圳, 中国', 22.5553, 113.8831, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('龙岗区', '龙岗区, 深圳, 中国', 22.7204, 114.2477, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('盐田区', '盐田区, 深圳, 中国', 22.5569, 114.2369, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('龙华区', '龙华区, 深圳, 中国', 22.6564, 114.0195, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('坪山区', '坪山区, 深圳, 中国', 22.6908, 114.3464, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('光明区', '光明区, 深圳, 中国', 22.7489, 113.9357, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 珠海市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('珠海', '珠海, 中国', 22.2707, 113.5767, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('香洲区', '香洲区, 珠海, 中国', 22.2665, 113.5438, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('斗门区', '斗门区, 珠海, 中国', 22.2092, 113.2965, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('金湾区', '金湾区, 珠海, 中国', 22.1469, 113.3634, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 汕头市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('汕头', '汕头, 中国', 23.3541, 116.6819, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('龙湖区', '龙湖区, 汕头, 中国', 23.3724, 116.7160, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('金平区', '金平区, 汕头, 中国', 23.3656, 116.7034, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('濠江区', '濠江区, 汕头, 中国', 23.2856, 116.7260, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('潮阳区', '潮阳区, 汕头, 中国', 23.2647, 116.6019, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('潮南区', '潮南区, 汕头, 中国', 23.2503, 116.4326, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('澄海区', '澄海区, 汕头, 中国', 23.4663, 116.7560, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('南澳县', '南澳县, 汕头, 中国', 23.4216, 117.0239, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 佛山市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('佛山', '佛山, 中国', 23.0215, 113.1214, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('禅城区', '禅城区, 佛山, 中国', 23.0094, 113.1227, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('南海区', '南海区, 佛山, 中国', 23.0288, 113.1426, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('顺德区', '顺德区, 佛山, 中国', 22.8051, 113.2934, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('三水区', '三水区, 佛山, 中国', 23.1554, 112.8967, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('高明区', '高明区, 佛山, 中国', 22.9002, 112.8926, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 韶关市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('韶关', '韶关, 中国', 24.8104, 113.5972, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('武江区', '武江区, 韶关, 中国', 24.7928, 113.5877, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('浈江区', '浈江区, 韶关, 中国', 24.8044, 113.6116, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('曲江区', '曲江区, 韶关, 中国', 24.6825, 113.6047, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('始兴县', '始兴县, 韶关, 中国', 24.9526, 114.0624, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('仁化县', '仁化县, 韶关, 中国', 25.0864, 113.7476, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('翁源县', '翁源县, 韶关, 中国', 24.3504, 114.1304, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('乳源瑶族自治县', '乳源瑶族自治县, 韶关, 中国', 24.7756, 113.2756, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('新丰县', '新丰县, 韶关, 中国', 24.0596, 114.2076, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('乐昌市', '乐昌市, 韶关, 中国', 25.1284, 113.3476, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('南雄市', '南雄市, 韶关, 中国', 25.1176, 114.3116, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 湛江市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('湛江', '湛江, 中国', 21.2707, 110.3647, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('赤坎区', '赤坎区, 湛江, 中国', 21.2734, 110.3656, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('霞山区', '霞山区, 湛江, 中国', 21.1924, 110.3976, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('坡头区', '坡头区, 湛江, 中国', 21.2447, 110.4556, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('麻章区', '麻章区, 湛江, 中国', 21.2634, 110.3346, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('遂溪县', '遂溪县, 湛江, 中国', 21.3769, 110.2504, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('徐闻县', '徐闻县, 湛江, 中国', 20.3256, 110.1756, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('廉江市', '廉江市, 湛江, 中国', 21.6094, 110.2846, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('雷州市', '雷州市, 湛江, 中国', 20.9144, 110.0956, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('吴川市', '吴川市, 湛江, 中国', 21.4416, 110.7786, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 肇庆市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('肇庆', '肇庆, 中国', 23.0472, 112.4655, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('端州区', '端州区, 肇庆, 中国', 23.0519, 112.4846, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('鼎湖区', '鼎湖区, 肇庆, 中国', 23.1556, 112.5676, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('高要区', '高要区, 肇庆, 中国', 23.0256, 112.4576, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('广宁县', '广宁县, 肇庆, 中国', 23.6346, 112.4406, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('怀集县', '怀集县, 肇庆, 中国', 23.9116, 112.1846, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('封开县', '封开县, 肇庆, 中国', 23.4346, 111.5026, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('德庆县', '德庆县, 肇庆, 中国', 23.1416, 111.7856, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('四会市', '四会市, 肇庆, 中国', 23.3264, 112.7336, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 江门市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('江门', '江门, 中国', 22.5787, 113.0815, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('蓬江区', '蓬江区, 江门, 中国', 22.5954, 113.0786, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('江海区', '江海区, 江门, 中国', 22.5604, 113.1116, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('新会区', '新会区, 江门, 中国', 22.4584, 113.0386, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('台山市', '台山市, 江门, 中国', 22.2516, 112.7936, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('开平市', '开平市, 江门, 中国', 22.3764, 112.6986, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('鹤山市', '鹤山市, 江门, 中国', 22.7684, 112.9646, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('恩平市', '恩平市, 江门, 中国', 22.1826, 112.3056, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 茂名市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('茂名', '茂名, 中国', 21.6598, 110.9254, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('茂南区', '茂南区, 茂名, 中国', 21.6414, 110.9186, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('电白区', '电白区, 茂名, 中国', 21.5144, 111.0076, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('高州市', '高州市, 茂名, 中国', 21.9184, 110.8536, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('化州市', '化州市, 茂名, 中国', 21.6644, 110.6396, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW()),
  ('信宜市', '信宜市, 茂名, 中国', 22.3544, 110.9476, 'Asia/Shanghai', 'CN', '中国', '广东', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 继续添加其他地级市...
-- 由于数据量很大，我会继续创建更多文件

