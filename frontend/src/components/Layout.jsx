import React from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
