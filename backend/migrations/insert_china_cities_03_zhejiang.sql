-- 中国城市预置数据 - 第三部分：浙江省
-- 包含：所有地级市及其下辖区县

-- ============================================
-- 浙江省
-- ============================================

-- 杭州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('杭州', '杭州, 中国', 30.2741, 120.1551, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('上城区', '上城区, 杭州, 中国', 30.2500, 120.1694, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('下城区', '下城区, 杭州, 中国', 30.2800, 120.1700, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('江干区', '江干区, 杭州, 中国', 30.2600, 120.2000, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('拱墅区', '拱墅区, 杭州, 中国', 30.3200, 120.1400, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('西湖区', '西湖区, 杭州, 中国', 30.2592, 120.1300, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('滨江区', '滨江区, 杭州, 中国', 30.2084, 120.2116, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('萧山区', '萧山区, 杭州, 中国', 30.1833, 120.2644, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('余杭区', '余杭区, 杭州, 中国', 30.2741, 120.1551, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('富阳区', '富阳区, 杭州, 中国', 30.0489, 119.9604, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('临安区', '临安区, 杭州, 中国', 30.2304, 119.7156, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('桐庐县', '桐庐县, 杭州, 中国', 29.7976, 119.6886, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('淳安县', '淳安县, 杭州, 中国', 29.6086, 119.0416, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('建德市', '建德市, 杭州, 中国', 29.4726, 119.2816, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 宁波市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('宁波', '宁波, 中国', 29.8683, 121.5440, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('海曙区', '海曙区, 宁波, 中国', 29.8594, 121.5506, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('江北区', '江北区, 宁波, 中国', 29.8884, 121.5556, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('北仑区', '北仑区, 宁波, 中国', 29.8994, 121.8446, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('镇海区', '镇海区, 宁波, 中国', 29.9494, 121.7146, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('鄞州区', '鄞州区, 宁波, 中国', 29.8164, 121.5486, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('奉化区', '奉化区, 宁波, 中国', 29.6556, 121.4066, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('象山县', '象山县, 宁波, 中国', 29.4766, 121.8696, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('宁海县', '宁海县, 宁波, 中国', 29.2876, 121.4296, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('余姚市', '余姚市, 宁波, 中国', 30.0376, 121.1546, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('慈溪市', '慈溪市, 宁波, 中国', 30.1696, 121.2666, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 温州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('温州', '温州, 中国', 28.0004, 120.6994, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('鹿城区', '鹿城区, 温州, 中国', 28.0124, 120.6556, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('龙湾区', '龙湾区, 温州, 中国', 27.9134, 120.8126, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('瓯海区', '瓯海区, 温州, 中国', 28.0064, 120.6376, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('洞头区', '洞头区, 温州, 中国', 27.8364, 121.1566, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('永嘉县', '永嘉县, 温州, 中国', 28.1536, 120.6916, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('平阳县', '平阳县, 温州, 中国', 27.6626, 120.5656, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('苍南县', '苍南县, 温州, 中国', 27.5176, 120.4266, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('文成县', '文成县, 温州, 中国', 27.7876, 120.0916, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('泰顺县', '泰顺县, 温州, 中国', 27.5576, 119.7166, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('瑞安市', '瑞安市, 温州, 中国', 27.7786, 120.6546, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('乐清市', '乐清市, 温州, 中国', 28.1126, 120.9836, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('龙港市', '龙港市, 温州, 中国', 27.6006, 120.5526, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 嘉兴市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('嘉兴', '嘉兴, 中国', 30.7627, 120.7500, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('南湖区', '南湖区, 嘉兴, 中国', 30.7476, 120.7856, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('秀洲区', '秀洲区, 嘉兴, 中国', 30.7636, 120.7096, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('嘉善县', '嘉善县, 嘉兴, 中国', 30.8416, 120.9256, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('海盐县', '海盐县, 嘉兴, 中国', 30.5256, 120.9456, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('海宁市', '海宁市, 嘉兴, 中国', 30.5306, 120.6806, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('平湖市', '平湖市, 嘉兴, 中国', 30.6756, 121.0146, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('桐乡市', '桐乡市, 嘉兴, 中国', 30.6306, 120.5646, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 湖州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('湖州', '湖州, 中国', 30.8930, 120.0858, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('吴兴区', '吴兴区, 湖州, 中国', 30.8676, 120.1056, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('南浔区', '南浔区, 湖州, 中国', 30.8766, 120.4186, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('德清县', '德清县, 湖州, 中国', 30.5426, 119.9676, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('长兴县', '长兴县, 湖州, 中国', 31.0266, 119.9106, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('安吉县', '安吉县, 湖州, 中国', 30.6376, 119.6806, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 绍兴市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('绍兴', '绍兴, 中国', 29.9970, 120.5820, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('越城区', '越城区, 绍兴, 中国', 29.9896, 120.5816, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('柯桥区', '柯桥区, 绍兴, 中国', 30.0816, 120.4946, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('上虞区', '上虞区, 绍兴, 中国', 30.0336, 120.8716, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('新昌县', '新昌县, 绍兴, 中国', 29.4996, 120.9056, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('诸暨市', '诸暨市, 绍兴, 中国', 29.7136, 120.2446, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('嵊州市', '嵊州市, 绍兴, 中国', 29.6016, 120.8286, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 金华市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('金华', '金华, 中国', 29.0790, 119.6474, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('婺城区', '婺城区, 金华, 中国', 29.0866, 119.6526, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('金东区', '金东区, 金华, 中国', 29.0996, 119.6926, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('武义县', '武义县, 金华, 中国', 28.9046, 119.8166, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('浦江县', '浦江县, 金华, 中国', 29.4516, 119.8926, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('磐安县', '磐安县, 金华, 中国', 29.0546, 120.4336, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('兰溪市', '兰溪市, 金华, 中国', 29.2086, 119.4606, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('义乌市', '义乌市, 金华, 中国', 29.3066, 120.0746, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('东阳市', '东阳市, 金华, 中国', 29.2896, 120.2416, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('永康市', '永康市, 金华, 中国', 28.8886, 120.0366, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 衢州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('衢州', '衢州, 中国', 28.9706, 118.8746, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('柯城区', '柯城区, 衢州, 中国', 28.9686, 118.8716, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('衢江区', '衢江区, 衢州, 中国', 28.9796, 118.9596, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('常山县', '常山县, 衢州, 中国', 28.9006, 118.5106, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('开化县', '开化县, 衢州, 中国', 29.1366, 118.4156, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('龙游县', '龙游县, 衢州, 中国', 29.0276, 119.1726, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('江山市', '江山市, 衢州, 中国', 28.7376, 118.6266, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 舟山市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('舟山', '舟山, 中国', 30.0160, 122.2072, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('定海区', '定海区, 舟山, 中国', 30.0166, 122.1066, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('普陀区', '普陀区, 舟山, 中国', 29.9516, 122.3016, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('岱山县', '岱山县, 舟山, 中国', 30.2426, 122.2016, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('嵊泗县', '嵊泗县, 舟山, 中国', 30.7256, 122.4576, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 台州市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('台州', '台州, 中国', 28.6564, 121.4208, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('椒江区', '椒江区, 台州, 中国', 28.6736, 121.4426, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('黄岩区', '黄岩区, 台州, 中国', 28.6496, 121.2616, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('路桥区', '路桥区, 台州, 中国', 28.5826, 121.3656, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('三门县', '三门县, 台州, 中国', 29.1176, 121.3766, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('天台县', '天台县, 台州, 中国', 29.1436, 121.0066, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('仙居县', '仙居县, 台州, 中国', 28.8476, 120.7286, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('温岭市', '温岭市, 台州, 中国', 28.3716, 121.3856, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('临海市', '临海市, 台州, 中国', 28.8586, 121.1446, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('玉环市', '玉环市, 台州, 中国', 28.1356, 121.2316, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

-- 丽水市
INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)
VALUES 
  ('丽水', '丽水, 中国', 28.4516, 119.9216, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('莲都区', '莲都区, 丽水, 中国', 28.4456, 119.9126, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('青田县', '青田县, 丽水, 中国', 28.1396, 120.2896, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('缙云县', '缙云县, 丽水, 中国', 28.6596, 120.0916, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('遂昌县', '遂昌县, 丽水, 中国', 28.5926, 119.2756, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('松阳县', '松阳县, 丽水, 中国', 28.4496, 119.4816, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('云和县', '云和县, 丽水, 中国', 28.1156, 119.5726, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('庆元县', '庆元县, 丽水, 中国', 27.6196, 119.0626, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('景宁畲族自治县', '景宁畲族自治县, 丽水, 中国', 27.9736, 119.6356, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW()),
  ('龙泉市', '龙泉市, 丽水, 中国', 28.0746, 119.1416, 'Asia/Shanghai', 'CN', '中国', '浙江', 100, NOW(), NOW(), NOW())
ON CONFLICT (city_name, latitude, longitude) DO NOTHING;

