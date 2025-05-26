import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext'; // Đường dẫn đúng
import { CartProvider } from '../contexts/CartContext'; // Đường dẫn đúng
import AppRoutes from './AppRoutes'; // Import các route cụ thể của user app
import LoadingSpinner from '../components/common/LoadingSpinner'; // Đường dẫn đúng

const MainRouter = () => {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    }>
      <Router>
        <AuthProvider>
          <CartProvider>
            {/* Tất cả các route của user app sẽ được quản lý bởi AppRoutes */}
            {/* Sử dụng path="/*" để AppRoutes xử lý tất cả các sub-paths */}
            <Routes>
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </Router>
    </Suspense>
  );
};

export default MainRouter;