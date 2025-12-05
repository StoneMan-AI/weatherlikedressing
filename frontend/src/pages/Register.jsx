import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    registerType: 'mobile' // 'mobile' or 'email'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    const userData = {
      password: formData.password
    };

    if (formData.registerType === 'mobile') {
      userData.mobile = formData.mobile;
    } else {
      userData.email = formData.email;
    }

    const result = await register(userData);

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
        <h1 className="auth-title">注册</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${formData.registerType === 'mobile' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, registerType: 'mobile', email: '' })}
            >
              手机号注册
            </button>
            <button
              type="button"
              className={`auth-tab ${formData.registerType === 'email' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, registerType: 'email', mobile: '' })}
            >
              邮箱注册
            </button>
          </div>

          {formData.registerType === 'mobile' ? (
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
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              className="input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="请再次输入密码"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="auth-footer">
          <span>已有账号？</span>
          <Link to="/login" className="auth-link">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
