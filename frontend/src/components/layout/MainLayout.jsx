// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingChatIcon from '../common/FloatingChatIcon';
// import './MainLayout.css'; // Nếu bạn có CSS riêng cho MainLayout

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100"> {/* Đảm bảo footer luôn ở cuối */}
      <Header />
      <main className="flex-grow-1 site-main-content"> {/* CSS: Thêm class để style nếu cần */}
        <Outlet />
      </main>
      <FloatingChatIcon />
      <Footer />
    </div>
  );
};

export default MainLayout;