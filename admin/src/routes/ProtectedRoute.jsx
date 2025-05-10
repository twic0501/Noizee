// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// import logger from '../utils/logger'; // Bỏ comment nếu muốn debug

const ProtectedRoute = ({ children }) => {
    const { isAdminAuthenticated } = useAuth(); // Sử dụng giá trị đã tính toán từ context
    const location = useLocation();

    // logger.debug('[ProtectedRoute Admin] isAdminAuthenticated:', isAdminAuthenticated, 'Current location:', location.pathname);

    if (!isAdminAuthenticated) {
        // logger.warn(`[ProtectedRoute Admin] Access denied for path: ${location.pathname}. Redirecting to /login.`);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;