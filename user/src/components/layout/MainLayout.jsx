// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Để render các trang con
import Header from './Header';
import Footer from './Footer';
// import NotificationPanel from '../features/NotificationPanel'; // Sẽ tạo sau
// import { useAuth } from '../../contexts/AuthContext'; // Sẽ tạo sau

const MainLayout = () => {
  // const { isNotificationPanelOpen, setIsNotificationPanelOpen } = useAuth(); // Ví dụ

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet /> {/* Nội dung của các trang sẽ được render ở đây */}
      </main>
      {/* {isNotificationPanelOpen && <NotificationPanel onClose={() => setIsNotificationPanelOpen(false)} />} */}
      <Footer />
    </div>
  );
};
export default MainLayout;