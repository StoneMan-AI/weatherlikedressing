/**
 * 地点路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./users');

/**
 * GET /api/locations
 * 获取用户的地点列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM locations WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error in /locations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/locations
 * 添加地点
 */
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('latitude').isFloat().withMessage('Latitude must be a number'),
  body('longitude').isFloat().withMessage('Longitude must be a number'),
  body('timezone').optional().isString(),
  body('is_default').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, latitude, longitude, timezone, is_default = false } = req.body;

    // 如果设置为默认，先取消其他地点的默认状态
    if (is_default) {
      await pool.query(
        'UPDATE locations SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO locations (user_id, name, latitude, longitude, timezone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, latitude, longitude, timezone || null, is_default]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /locations POST:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/locations/:id
 * 更新地点
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const locationId = req.params.id;
    const { name, latitude, longitude, timezone, is_default } = req.body;

    // 检查地点是否属于该用户
    const checkResult = await pool.query(
      'SELECT id FROM locations WHERE id = $1 AND user_id = $2',
      [locationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // 如果设置为默认，先取消其他地点的默认状态
    if (is_default) {
      await pool.query(
        'UPDATE locations SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, locationId]
      );
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(longitude);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(is_default);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(locationId, userId);
    const result = await pool.query(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /locations/:id PUT:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/locations/:id
 * 删除地点
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const locationId = req.params.id;

    const result = await pool.query(
      'DELETE FROM locations WHERE id = $1 AND user_id = $2 RETURNING id',
      [locationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error in /locations/:id DELETE:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
