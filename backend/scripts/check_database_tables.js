/**
 * 检查数据库表是否存在
 * 用于诊断问题
 */

const pool = require('../config/database');

async function checkTables() {
  try {
    console.log('检查数据库表...\n');

    const tables = [
      'weather_data_cache',
      'active_regions',
      'weather_requests'
    ];

    for (const tableName of tables) {
      try {
        const result = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [tableName]
        );

        const exists = result.rows[0].exists;
        console.log(`${tableName}: ${exists ? '✅ 存在' : '❌ 不存在'}`);

        if (exists) {
          // 检查表结构
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`  └─ 记录数: ${countResult.rows[0].count}`);
        }
      } catch (error) {
        console.error(`检查 ${tableName} 时出错:`, error.message);
      }
    }

    console.log('\n检查完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库连接错误:', error);
    process.exit(1);
  }
}

checkTables();

