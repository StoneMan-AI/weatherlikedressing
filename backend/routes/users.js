/**
 * 用户路由
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

/**
 * POST /api/users/register
 * 用户注册
 */
router.post('/register', [
  body('mobile').optional().isMobilePhone('zh-CN'),
  body('email').optional().isEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('language').optional().isIn(['zh-CN', 'en']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mobile, email, password, language = 'zh-CN', country_code } = req.body;

    if (!mobile && !email) {
      return res.status(400).json({ error: 'Mobile or email is required' });
    }

    // 检查用户是否已存在
    let existingUser;
    if (mobile) {
      const result = await pool.query('SELECT id FROM users WHERE mobile = $1', [mobile]);
      existingUser = result.rows[0];
    } else if (email) {
      const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      existingUser = result.rows[0];
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await pool.query(
      `INSERT INTO users (mobile, email, password_hash, language, country_code, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, mobile, email, language, country_code, created_at`,
      [mobile || null, email || null, passwordHash, language, country_code || null]
    );

    const user = result.rows[0];

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          language: user.language,
          country_code: user.country_code
        },
        token
      }
    });
  } catch (error) {
    console.error('Error in /users/register:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/login
 * 用户登录
 */
router.post('/login', [
  body('mobile').optional(),
  body('email').optional(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mobile, email, password } = req.body;

    if (!mobile && !email) {
      return res.status(400).json({ error: 'Mobile or email is required' });
    }

    // 查找用户
    let user;
    if (mobile) {
      const result = await pool.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
      user = result.rows[0];
    } else {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 更新最后登录时间
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          language: user.language,
          country_code: user.country_code,
          profile_json: user.profile_json,
          membership_status: user.membership_status
        },
        token
      }
    });
  } catch (error) {
    console.error('Error in /users/login:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/profile
 * 获取用户资料
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /users/profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/profile
 * 更新用户资料
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { language, country_code, profile_json, push_pref_json } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (country_code !== undefined) {
      updates.push(`country_code = $${paramCount++}`);
      values.push(country_code);
    }

    if (profile_json !== undefined) {
      updates.push(`profile_json = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(profile_json));
    }

    if (push_pref_json !== undefined) {
      updates.push(`push_pref_json = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(push_pref_json));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /users/profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * JWT认证中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// 导出中间件供其他路由使用
router.authenticateToken = authenticateToken;

module.exports = router;
