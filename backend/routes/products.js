/**
 * 商品路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/products
 * 获取商品列表
 */
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20, country_code } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    // 如果指定了country_code且不是中国，排除不海外配送的商品
    if (country_code && country_code !== 'CN') {
      query += ` AND (shipping_exclude_overseas = false OR shipping_exclude_overseas IS NULL)`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const countParams = [];
    if (category) {
      countQuery += ` AND category = $1`;
      countParams.push(category);
    }
    if (country_code && country_code !== 'CN') {
      countQuery += ` AND (shipping_exclude_overseas = false OR shipping_exclude_overseas IS NULL)`;
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        products: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error in /products:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/products/:id
 * 获取商品详情
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /products/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
