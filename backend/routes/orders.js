/**
 * 订单路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// 导入用户认证中间件
const { authenticateToken } = require('./users');

/**
 * POST /api/orders
 * 创建订单
 */
router.post('/', authenticateToken, [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items } = req.body;
    const userId = req.user.id;

    // 开启事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 计算总金额并验证商品
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        // 获取商品信息
        const productResult = await client.query(
          'SELECT id, price_cny, stock_qty, title_cn, sku FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const product = productResult.rows[0];

        // 检查库存
        if (product.stock_qty < item.qty) {
          throw new Error(`Insufficient stock for product ${product.title_cn}`);
        }

        const itemTotal = parseFloat(product.price_cny) * item.qty;
        totalAmount += itemTotal;

        orderItems.push({
          product_id: product.id,
          sku: product.sku,
          qty: item.qty,
          unit_price: parseFloat(product.price_cny)
        });
      }

      // 生成订单号
      const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 创建订单
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, order_no, total_amount_cny, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending', NOW(), NOW())
         RETURNING id, order_no, total_amount_cny, status, created_at`,
        [userId, orderNo, totalAmount]
      );

      const order = orderResult.rows[0];

      // 创建订单项并更新库存
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, sku, qty, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.sku, item.qty, item.unit_price]
        );

        // 更新库存（这里先不减，等支付成功后再减，或者根据业务需求调整）
        // await client.query(
        //   'UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2',
        //   [item.qty, item.product_id]
        // );
      }

      await client.query('COMMIT');

      // 获取完整的订单信息
      const orderItemsResult = await client.query(
        `SELECT oi.*, p.title_cn, p.title_en, p.thumbnail_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      res.status(201).json({
        success: true,
        data: {
          ...order,
          items: orderItemsResult.rows
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in /orders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders
 * 获取用户的订单列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT o.*, 
             (SELECT json_agg(json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'sku', oi.sku,
               'qty', oi.qty,
               'unit_price', oi.unit_price,
               'title_cn', p.title_cn,
               'title_en', p.title_en,
               'thumbnail_url', p.thumbnail_url
             )) FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = o.id) as items
      FROM orders o
      WHERE o.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (status) {
      query += ` AND o.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error in /orders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * 获取订单详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, p.title_cn, p.title_en, p.thumbnail_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error in /orders/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/orders/:id/status
 * 更新订单状态（例如：支付后更新为paid）
 */
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const orderId = req.params.id;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /orders/:id/status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
