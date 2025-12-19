/**
 * 检查数据库表是否存在
 * 用于诊断问题
 */

require('dotenv').config();
const pool = require('../config/database');

async function checkTables() {
  try {
    console.log('检查数据库连接配置...');
    console.log(`数据库主机: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`数据库端口: ${process.env.DB_PORT || 5432}`);
    console.log(`数据库名称: ${process.env.DB_NAME || 'weather_dressing'}`);
    console.log(`数据库用户: ${process.env.DB_USER || 'postgres'}`);
    console.log(`密码已设置: ${process.env.DB_PASSWORD ? '是' : '否（可能为空）'}\n`);

    // 测试数据库连接
    console.log('测试数据库连接...');
    await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功\n');

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
            WHERE table_schema = 'public' 
            AND table_name = $1
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
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库连接错误:', error.message);
    console.error('\n请检查：');
    console.error('1. 数据库服务是否运行');
    console.error('2. .env 文件中的数据库配置是否正确');
    console.error('3. 数据库用户和密码是否正确');
    console.error('\n提示：如果数据库没有密码，请在 .env 文件中设置 DB_PASSWORD=""');
    await pool.end();
    process.exit(1);
  }
}

checkTables();

