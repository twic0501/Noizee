// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Hook để lấy trạng thái auth

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Lấy trạng thái đăng nhập từ context
  const location = useLocation(); // Lấy thông tin về route hiện tại

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    // state={{ from: location }} dùng để lưu lại trang người dùng đang cố truy cập,
    // để sau khi đăng nhập thành công có thể điều hướng họ trở lại.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render component con (children) nếu được truyền vào,
  // hoặc render <Outlet /> để render các route con lồng nhau.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;