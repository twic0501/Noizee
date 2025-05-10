// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Để render nội dung của route con
import Header from './Header';             // Import Header component
import Footer from './Footer';             // Import Footer component
import FloatingChatIcon from '../common/FloatingChatIcon'; // Import Icon Chat

// Component Layout chính bao gồm Header, Footer và phần nội dung thay đổi (Outlet)
const MainLayout = () => {
  return (
    <>
      {/* Header sẽ được hiển thị ở đây */}
      <Header />

      {/* Phần nội dung chính của các trang con sẽ được render vào <Outlet /> */}
      <main>
        <Outlet />
      </main>

      {/* Footer sẽ được hiển thị ở đây */}
      <Footer />

      {/* Icon chat nổi (hiển thị trên tất cả các trang dùng layout này) */}
      <FloatingChatIcon />
    </>
  );
};

export default MainLayout;