// user/src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Đảm bảo đường dẫn đúng
import LoadingSpinner from '../components/common/LoadingSpinner'; // Đảm bảo đường dẫn đúng

const ProtectedRoute = ({ children, rolesAllowed }) => { // Thêm prop rolesAllowed nếu cần phân quyền theo role
  const { authState } = useAuth();
  const location = useLocation();

  // Hiển thị loading trong khi AuthContext đang xác thực ban đầu
  if (authState.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  // Lưu lại trang hiện tại để có thể quay lại sau khi login thành công
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // (Tùy chọn) Kiểm tra vai trò nếu route này yêu cầu vai trò cụ thể
  if (rolesAllowed && rolesAllowed.length > 0 && !rolesAllowed.includes(authState.user?.role)) {
    // Nếu vai trò không được phép, có thể chuyển hướng đến trang "Không có quyền truy cập" (403)
    // hoặc trang chủ.
    // Ví dụ: return <Navigate to="/unauthorized" replace />;
    console.warn(`User with role "${authState.user?.role}" tried to access a route requiring roles: ${rolesAllowed.join(', ')}`);
    return <Navigate to="/" replace />; // Hoặc một trang thông báo lỗi 403
  }

  // Nếu đã đăng nhập (và có vai trò phù hợp nếu được yêu cầu), render children hoặc Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;