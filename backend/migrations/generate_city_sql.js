/**
 * 中国城市数据SQL生成脚本
 * 从JSON数据文件生成SQL插入语句
 * 
 * 使用方法：
 * 1. 准备JSON数据文件（格式见示例）
 * 2. 运行: node generate_city_sql.js
 */

const fs = require('fs');
const path = require('path');

// 中国省份列表（按地区分组）
const PROVINCES = {
  // 华东地区
  '江苏': 'jiangsu',
  '山东': 'shandong',
  '安徽': 'anhui',
  '江西': 'jiangxi',
  '福建': 'fujian',
  
  // 华中地区
  '河南': 'henan',
  '湖北': 'hubei',
  '湖南': 'hunan',
  
  // 华北地区
  '河北': 'hebei',
  '山西': 'shanxi',
  '内蒙古': 'neimenggu',
  
  // 华南地区
  '广西': 'guangxi',
  '海南': 'hainan',
  
  // 西南地区
  '四川': 'sichuan',
  '贵州': 'guizhou',
  '云南': 'yunnan',
  '西藏': 'xizang',
  
  // 西北地区
  '陕西': 'shaanxi',
  '甘肃': 'gansu',
  '青海': 'qinghai',
  '宁夏': 'ningxia',
  '新疆': 'xinjiang',
  
  // 东北地区
  '辽宁': 'liaoning',
  '吉林': 'jilin',
  '黑龙江': 'heilongjiang'
};

/**
 * 生成SQL文件内容
 */
function generateSQLFile(provinceName, cities) {
  const provinceCode = PROVINCES[provinceName] || provinceName.toLowerCase();
  const fileName = `insert_china_cities_${getFileNumber(provinceName)}_${provinceCode}.sql`;
  
  let sql = `-- 中国城市预置数据 - ${provinceName}省\n`;
  sql += `-- 包含：所有地级市及其下辖区县\n\n`;
  sql += `-- ============================================\n`;
  sql += `-- ${provinceName}省\n`;
  sql += `-- ============================================\n\n`;
  
  // 按地级市分组
  const citiesByPrefecture = groupByPrefecture(cities);
  
  for (const [prefecture, cityList] of Object.entries(citiesByPrefecture)) {
    sql += `-- ${prefecture}\n`;
    sql += `INSERT INTO city_geocoding_cache (city_name, display_name, latitude, longitude, timezone, country_code, country_name, state, search_count, last_searched_at, created_at, updated_at)\n`;
    sql += `VALUES \n`;
    
    const values = cityList.map((city, index) => {
      const comma = index < cityList.length - 1 ? ',' : '';
      return `  ('${city.name}', '${city.display_name}', ${city.latitude}, ${city.longitude}, '${city.timezone || 'Asia/Shanghai'}', '${city.country_code || 'CN'}', '${city.country_name || '中国'}', '${city.state || provinceName}', 100, NOW(), NOW(), NOW())${comma}`;
    });
    
    sql += values.join('\n');
    sql += `\nON CONFLICT (city_name, latitude, longitude) DO NOTHING;\n\n`;
  }
  
  return { fileName, content: sql };
}

/**
 * 按地级市分组
 */
function groupByPrefecture(cities) {
  const grouped = {};
  
  for (const city of cities) {
    const prefecture = city.prefecture || city.name;
    if (!grouped[prefecture]) {
      grouped[prefecture] = [];
    }
    grouped[prefecture].push(city);
  }
  
  return grouped;
}

/**
 * 获取文件编号（用于排序）
 */
function getFileNumber(provinceName) {
  const order = [
    '江苏', '山东', '安徽', '江西', '福建',
    '河南', '湖北', '湖南',
    '河北', '山西', '内蒙古',
    '广西', '海南',
    '四川', '贵州', '云南', '西藏',
    '陕西', '甘肃', '青海', '宁夏', '新疆',
    '辽宁', '吉林', '黑龙江'
  ];
  
  const index = order.indexOf(provinceName);
  return index >= 0 ? String(index + 4).padStart(2, '0') : '99';
}

/**
 * 从JSON文件读取数据并生成SQL
 */
function generateFromJSON(jsonFilePath) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const files = [];
    
    // 按省份分组
    const byProvince = {};
    for (const city of data.cities || []) {
      const province = city.state || city.province;
      if (!byProvince[province]) {
        byProvince[province] = [];
      }
      byProvince[province].push(city);
    }
    
    // 为每个省份生成SQL文件
    for (const [province, cities] of Object.entries(byProvince)) {
      if (PROVINCES[province]) {
        const { fileName, content } = generateSQLFile(province, cities);
        files.push({ fileName, content, province });
      }
    }
    
    return files;
  } catch (error) {
    console.error('读取JSON文件失败:', error.message);
    return [];
  }
}

/**
 * 生成示例数据模板
 */
function generateTemplate() {
  const template = {
    cities: [
      {
        name: '城市名称',
        display_name: '城市名称, 省份, 中国',
        latitude: 39.9042,
        longitude: 116.4074,
        timezone: 'Asia/Shanghai',
        country_code: 'CN',
        country_name: '中国',
        state: '省份',
        prefecture: '地级市名称' // 可选，用于分组
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'china_cities_template.json'),
    JSON.stringify(template, null, 2),
    'utf8'
  );
  
  console.log('已生成数据模板文件: china_cities_template.json');
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'template') {
    // 生成模板文件
    generateTemplate();
    return;
  }
  
  // 默认：从JSON文件生成SQL
  const jsonFile = args[0] || path.join(__dirname, 'china_cities_data.json');
  
  if (!fs.existsSync(jsonFile)) {
    console.log('JSON数据文件不存在，正在生成模板文件...');
    generateTemplate();
    console.log('\n请按照模板格式填写城市数据，然后重新运行脚本。');
    console.log('示例命令: node generate_city_sql.js china_cities_data.json');
    return;
  }
  
  console.log(`正在从 ${jsonFile} 读取数据...`);
  const files = generateFromJSON(jsonFile);
  
  if (files.length === 0) {
    console.log('未找到有效数据，请检查JSON文件格式。');
    return;
  }
  
  // 写入SQL文件
  const outputDir = __dirname;
  for (const { fileName, content, province } of files) {
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ 已生成: ${fileName} (${province}省)`);
  }
  
  console.log(`\n共生成 ${files.length} 个SQL文件。`);
  console.log('请按顺序执行这些SQL文件导入数据库。');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { generateSQLFile, generateFromJSON };

