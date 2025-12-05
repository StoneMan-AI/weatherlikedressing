/**
 * 初始化规则配置到数据库
 * 运行: node scripts/init_rules.js
 */

const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initRules() {
  try {
    // 读取规则配置文件
    const rulesPath = path.join(__dirname, '../../dressing_rules_v1.json');
    const rulesData = fs.readFileSync(rulesPath, 'utf8');
    const rulesConfig = JSON.parse(rulesData);

    // 插入或更新规则配置
    const result = await pool.query(
      `INSERT INTO config_rules (name, version, config_json, enabled)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        'dressing_rules',
        rulesConfig.meta.version || '1.0',
        JSON.stringify(rulesConfig),
        true
      ]
    );

    if (result.rows.length > 0) {
      console.log('✅ 规则配置已成功初始化到数据库');
      console.log(`规则ID: ${result.rows[0].id}`);
    } else {
      console.log('ℹ️  规则配置已存在，跳过插入');
    }
  } catch (error) {
    console.error('❌ 初始化规则配置失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initRules();
