/**
 * 创建天气缓存相关的数据库表
 * 用于生产环境部署
 */

require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('开始创建天气缓存相关表...\n');

    // 开始事务
    await client.query('BEGIN');

    // 创建 weather_data_cache 表
    console.log('创建 weather_data_cache 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_data_cache (
        id BIGSERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
        weather_data JSONB NOT NULL,
        aqi INTEGER,
        aqi_status VARCHAR(32),
        last_updated TIMESTAMPTZ DEFAULT now(),
        next_update_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(latitude, longitude, timezone)
      )
    `);
    console.log('✅ weather_data_cache 表创建成功');

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weather_cache_coords 
      ON weather_data_cache(latitude, longitude)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weather_cache_update_time 
      ON weather_data_cache(next_update_time)
    `);
    console.log('✅ weather_data_cache 索引创建成功');

    // 创建 active_regions 表
    console.log('\n创建 active_regions 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS active_regions (
        id BIGSERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
        last_requested_at TIMESTAMPTZ DEFAULT now(),
        request_count INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(latitude, longitude, timezone)
      )
    `);
    console.log('✅ active_regions 表创建成功');

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_active_regions_coords 
      ON active_regions(latitude, longitude)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_active_regions_last_requested 
      ON active_regions(last_requested_at)
    `);
    console.log('✅ active_regions 索引创建成功');

    // 创建 weather_requests 表
    console.log('\n创建 weather_requests 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_requests (
        id BIGSERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone VARCHAR(64),
        requested_at TIMESTAMPTZ DEFAULT now(),
        source VARCHAR(32) DEFAULT 'cache'
      )
    `);
    console.log('✅ weather_requests 表创建成功');

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weather_requests_coords 
      ON weather_requests(latitude, longitude)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weather_requests_time 
      ON weather_requests(requested_at)
    `);
    console.log('✅ weather_requests 索引创建成功');

    // 提交事务
    await client.query('COMMIT');
    
    console.log('\n✅ 所有表创建成功！');
    
    // 验证表是否存在
    console.log('\n验证表创建情况...');
    const tables = ['weather_data_cache', 'active_regions', 'weather_requests'];
    for (const tableName of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      if (result.rows[0].exists) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: 存在 (记录数: ${countResult.rows[0].count})`);
      } else {
        console.log(`  ❌ ${tableName}: 不存在`);
      }
    }

  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('\n❌ 创建表时出错:', error.message);
    console.error('错误详情:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行创建
createTables()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  });

