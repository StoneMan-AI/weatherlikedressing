import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    password: '',
    loginType: 'mobile' // 'mobile' or 'email'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const credentials = {
      password: formData.password
    };

    if (formData.loginType === 'mobile') {
      credentials.mobile = formData.mobile;
    } else {
      credentials.email = formData.email;
    }

    const result = await login(credentials);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">登录</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${formData.loginType === 'mobile' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, loginType: 'mobile', email: '' })}
            >
              手机号登录
            </button>
            <button
              type="button"
              className={`auth-tab ${formData.loginType === 'email' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, loginType: 'email', mobile: '' })}
            >
              邮箱登录
            </button>
          </div>

          {formData.loginType === 'mobile' ? (
            <div className="form-group">
              <label>手机号</label>
              <input
                type="tel"
                className="input"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="请输入手机号"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-footer">
          <span>还没有账号？</span>
          <Link to="/register" className="auth-link">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
