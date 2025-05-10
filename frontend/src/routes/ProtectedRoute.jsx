import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Hook để lấy trạng thái auth

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Lấy trạng thái đăng nhập
  const location = useLocation();

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    // Lưu lại trang định đến để quay lại sau khi login thành công
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render component con (children) hoặc Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;