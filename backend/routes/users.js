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
 * 获取用户资料（支持匿名用户）
 * 如果已登录，使用登录用户ID；否则使用X-User-ID查找匿名用户
 */
router.get('/profile', async (req, res) => {
  try {
    let userId;
    
    // 尝试从token中获取用户ID（如果已登录）
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token无效，继续使用匿名用户ID
        console.warn('Invalid token, using anonymous user ID');
      }
    }
    
    // 如果没有登录用户ID，使用匿名用户ID（从中间件获取）
    if (!userId) {
      const anonymousId = req.userId || req.anonymousUserId;
      
      if (!anonymousId) {
        return res.status(400).json({ error: 'User ID required. Please provide X-User-ID header or login.' });
      }
      
      // 查找匿名用户（通过profile_json中的anonymous_id字段）
      const anonymousUserResult = await pool.query(
        `SELECT id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json, created_at 
         FROM users 
         WHERE profile_json->>'anonymous_id' = $1`,
        [anonymousId]
      );
      
      if (anonymousUserResult.rows.length > 0) {
        userId = anonymousUserResult.rows[0].id;
      } else {
        // 如果匿名用户不存在，返回默认数据
        return res.json({
          success: true,
          data: {
            id: null,
            mobile: null,
            email: null,
            language: 'zh-CN',
            country_code: null,
            profile_json: {},
            membership_status: 'free',
            push_pref_json: {}
          }
        });
      }
    }
    
    const result = await pool.query(
      'SELECT id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json, created_at FROM users WHERE id = $1',
      [userId]
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
 * 更新用户资料（支持匿名用户）
 * 如果已登录，使用登录用户ID；否则使用X-User-ID创建或更新匿名用户
 */
router.put('/profile', async (req, res) => {
  try {
    const { language, country_code, profile_json, push_pref_json } = req.body;

    // 确定用户ID：优先使用登录用户ID，否则使用匿名用户ID
    let userId;
    
    // 尝试从token中获取用户ID（如果已登录）
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token无效，继续使用匿名用户ID
        console.warn('Invalid token, using anonymous user ID');
      }
    }
    
    // 如果没有登录用户ID，使用匿名用户ID（从中间件获取）
    if (!userId) {
      const anonymousId = req.userId || req.anonymousUserId;
      
      if (!anonymousId) {
        return res.status(400).json({ error: 'User ID required. Please provide X-User-ID header or login.' });
      }
      
      // 检查匿名用户是否存在（通过profile_json中的anonymous_id字段查找）
      let existingUser = await pool.query(
        `SELECT id FROM users WHERE profile_json->>'anonymous_id' = $1`,
        [anonymousId]
      );
      
      if (existingUser.rows.length === 0) {
        // 创建匿名用户记录，将anonymous_id存储在profile_json中
        const initialProfileJson = profile_json ? {
          ...profile_json,
          anonymous_id: anonymousId
        } : {
          anonymous_id: anonymousId
        };
        
        const createResult = await pool.query(
          `INSERT INTO users (mobile, email, password_hash, language, country_code, profile_json, created_at)
           VALUES (NULL, NULL, NULL, $1, NULL, $2::jsonb, NOW())
           RETURNING id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json`,
          [language || 'zh-CN', JSON.stringify(initialProfileJson)]
        );
        
        userId = createResult.rows[0].id;
      } else {
        userId = existingUser.rows[0].id;
        
        // 确保profile_json中包含anonymous_id
        const userResult = await pool.query('SELECT profile_json FROM users WHERE id = $1', [userId]);
        const currentProfileJson = userResult.rows[0]?.profile_json || {};
        if (!currentProfileJson.anonymous_id) {
          await pool.query(
            `UPDATE users SET profile_json = jsonb_set(COALESCE(profile_json, '{}'::jsonb), '{anonymous_id}', $1::jsonb) WHERE id = $2`,
            [JSON.stringify(anonymousId), userId]
          );
        }
      }
    }

    // 更新用户资料
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
      // 如果是匿名用户，确保保留anonymous_id
      if (!req.user && req.anonymousUserId) {
        const finalProfileJson = {
          ...profile_json,
          anonymous_id: req.anonymousUserId
        };
        updates.push(`profile_json = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(finalProfileJson));
      } else {
        updates.push(`profile_json = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(profile_json));
      }
    }

    if (push_pref_json !== undefined) {
      updates.push(`push_pref_json = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(push_pref_json));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, mobile, email, language, country_code, profile_json, membership_status, push_pref_json`,
      values
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
