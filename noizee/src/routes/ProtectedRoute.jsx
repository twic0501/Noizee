import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Đường dẫn tới AuthContext
import LoadingSpinner from '../components/common/LoadingSpinner'; // Component loading

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loadingAuth } = useAuth();
    const location = useLocation();

    if (loadingAuth) {
        // Hiển thị loading spinner trong khi kiểm tra trạng thái xác thực
        return <LoadingSpinner fullPage />;
    }

    if (!isAuthenticated) {
        // Nếu chưa đăng nhập, điều hướng về trang login
        // state={{ from: location }} để có thể quay lại trang trước đó sau khi login thành công
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Nếu đã đăng nhập, render children (component con)
    // Hoặc dùng <Outlet /> nếu bạn dùng ProtectedRoute như một layout route wrapper
    return children ? children : <Outlet />;
};

export default ProtectedRoute;