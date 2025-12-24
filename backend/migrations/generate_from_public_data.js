/**
 * 从公开数据源生成城市数据
 * 这个脚本可以帮助您从各种公开数据源获取中国城市数据
 * 
 * 数据源建议：
 * 1. 国家统计局行政区划代码
 * 2. 高德地图/百度地图API
 * 3. 民政部行政区划数据
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * 示例：从高德地图API获取城市数据（需要API密钥）
 */
async function fetchFromAmap(apiKey) {
  // 注意：这需要高德地图API密钥
  // 实际使用时需要调用高德地图的行政区域查询API
  console.log('高德地图API需要密钥，请参考官方文档');
}

/**
 * 生成基础城市数据（基于常见城市列表）
 * 这是一个快速生成脚本，包含主要城市
 */
function generateBasicCities() {
  const basicCities = {
    // 江苏省主要城市
    jiangsu: [
      { name: '南京', lat: 32.0603, lon: 118.7969, prefecture: '南京' },
      { name: '苏州', lat: 31.2989, lon: 120.5853, prefecture: '苏州' },
      { name: '无锡', lat: 31.4912, lon: 120.3124, prefecture: '无锡' },
      { name: '常州', lat: 31.8107, lon: 119.9739, prefecture: '常州' },
      { name: '镇江', lat: 32.1878, lon: 119.4548, prefecture: '镇江' },
      { name: '扬州', lat: 32.3932, lon: 119.4129, prefecture: '扬州' },
      { name: '泰州', lat: 32.4554, lon: 119.9254, prefecture: '泰州' },
      { name: '南通', lat: 31.9802, lon: 120.8943, prefecture: '南通' },
      { name: '盐城', lat: 33.3775, lon: 120.1633, prefecture: '盐城' },
      { name: '淮安', lat: 33.5975, lon: 119.0213, prefecture: '淮安' },
      { name: '宿迁', lat: 33.9630, lon: 118.2752, prefecture: '宿迁' },
      { name: '徐州', lat: 34.2042, lon: 117.2859, prefecture: '徐州' },
      { name: '连云港', lat: 34.5969, lon: 119.1788, prefecture: '连云港' }
    ],
    
    // 山东省主要城市
    shandong: [
      { name: '济南', lat: 36.6512, lon: 117.1201, prefecture: '济南' },
      { name: '青岛', lat: 36.0671, lon: 120.3826, prefecture: '青岛' },
      { name: '淄博', lat: 36.8135, lon: 118.0549, prefecture: '淄博' },
      { name: '枣庄', lat: 34.8104, lon: 117.3239, prefecture: '枣庄' },
      { name: '东营', lat: 37.4348, lon: 118.6746, prefecture: '东营' },
      { name: '烟台', lat: 37.4638, lon: 121.4479, prefecture: '烟台' },
      { name: '潍坊', lat: 36.7069, lon: 119.1617, prefecture: '潍坊' },
      { name: '济宁', lat: 35.4149, lon: 116.5872, prefecture: '济宁' },
      { name: '泰安', lat: 36.2002, lon: 117.1201, prefecture: '泰安' },
      { name: '威海', lat: 37.5133, lon: 122.1214, prefecture: '威海' },
      { name: '日照', lat: 35.4168, lon: 119.5268, prefecture: '日照' },
      { name: '临沂', lat: 35.0518, lon: 118.3264, prefecture: '临沂' },
      { name: '德州', lat: 37.4513, lon: 116.3594, prefecture: '德州' },
      { name: '聊城', lat: 36.4560, lon: 115.9854, prefecture: '聊城' },
      { name: '滨州', lat: 37.3833, lon: 117.9704, prefecture: '滨州' },
      { name: '菏泽', lat: 35.2465, lon: 115.4806, prefecture: '菏泽' }
    ]
  };
  
  // 转换为标准格式
  const result = { cities: [] };
  
  for (const [provinceCode, cities] of Object.entries(basicCities)) {
    const provinceName = getProvinceName(provinceCode);
    for (const city of cities) {
      result.cities.push({
        name: city.name,
        display_name: `${city.name}, ${provinceName}, 中国`,
        latitude: city.lat,
        longitude: city.lon,
        timezone: 'Asia/Shanghai',
        country_code: 'CN',
        country_name: '中国',
        state: provinceName,
        prefecture: city.prefecture
      });
    }
  }
  
  return result;
}

function getProvinceName(code) {
  const map = {
    'jiangsu': '江苏',
    'shandong': '山东',
    'anhui': '安徽',
    'jiangxi': '江西',
    'fujian': '福建',
    'henan': '河南',
    'hubei': '湖北',
    'hunan': '湖南',
    'hebei': '河北',
    'shanxi': '山西',
    'neimenggu': '内蒙古',
    'guangxi': '广西',
    'hainan': '海南',
    'sichuan': '四川',
    'guizhou': '贵州',
    'yunnan': '云南',
    'xizang': '西藏',
    'shaanxi': '陕西',
    'gansu': '甘肃',
    'qinghai': '青海',
    'ningxia': '宁夏',
    'xinjiang': '新疆',
    'liaoning': '辽宁',
    'jilin': '吉林',
    'heilongjiang': '黑龙江'
  };
  return map[code] || code;
}

/**
 * 生成并保存基础数据
 */
function main() {
  const data = generateBasicCities();
  const outputFile = path.join(__dirname, 'china_cities_basic.json');
  
  fs.writeFileSync(
    outputFile,
    JSON.stringify(data, null, 2),
    'utf8'
  );
  
  console.log(`已生成基础城市数据文件: ${outputFile}`);
  console.log(`包含 ${data.cities.length} 个城市`);
  console.log('\n您可以：');
  console.log('1. 编辑此文件添加更多城市数据');
  console.log('2. 运行 node generate_city_sql.js china_cities_basic.json 生成SQL文件');
}

if (require.main === module) {
  main();
}

module.exports = { generateBasicCities };

