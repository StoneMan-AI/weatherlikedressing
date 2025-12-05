import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            🌤️ 智能穿衣
          </Link>
          <div className="navbar-menu">
            <Link
              to="/"
              className={`navbar-item ${isActive('/') ? 'active' : ''}`}
            >
              首页
            </Link>
            <Link
              to="/products"
              className={`navbar-item ${isActive('/products') ? 'active' : ''}`}
            >
              商城
            </Link>
            <Link
              to="/orders"
              className={`navbar-item ${isActive('/orders') ? 'active' : ''}`}
            >
              订单
            </Link>
            <Link
              to="/settings"
              className={`navbar-item ${isActive('/settings') ? 'active' : ''}`}
            >
              设置
            </Link>
            <div className="navbar-user">
              <span>{user?.mobile || user?.email || '用户'}</span>
              <button onClick={handleLogout} className="btn-logout">
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
