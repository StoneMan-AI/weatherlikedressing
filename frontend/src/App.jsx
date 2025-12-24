import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import './App.css';

/**
 * 应用主组件
 * 
 * 访问流程：
 * - 打开主页（/）时，直接显示应用首页，无需登录
 * - 用户可以直接使用所有核心功能（天气查询、穿衣推荐等）
 * - 所有未匹配的路由都会重定向到首页
 */
function App() {
  return (
    <AuthProvider>
      <LocationProvider>
      <Router>
        <Routes>
            {/* 主页路由 - 无需登录，直接访问 */}
          <Route
            path="/"
            element={
                <Layout>
                  <Home />
                </Layout>
            }
          />
            {/* 用户画像设置页面 */}
          <Route
            path="/settings"
            element={
                <Layout>
                  <Settings />
                </Layout>
            }
          />
            {/* 所有其他路由重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
