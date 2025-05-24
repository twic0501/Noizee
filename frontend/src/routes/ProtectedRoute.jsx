import React from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'; // Thêm useParams
import { useAuth } from '../hooks/useAuth'; // Hook để lấy trạng thái auth
import { useTranslation } from 'react-i18next'; // Import useTranslation

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Lấy trạng thái đăng nhập từ context
  const location = useLocation(); // Lấy thông tin về route hiện tại
  const params = useParams(); // Lấy lang từ URL
  const { i18n } = useTranslation(); // Lấy instance i18n
  const currentLang = params.lang || i18n.language || 'vi'; // Xác định ngôn ngữ hiện tại

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login với prefix ngôn ngữ hiện tại
    // state={{ from: location }} dùng để lưu lại trang người dùng đang cố truy cập,
    // để sau khi đăng nhập thành công có thể điều hướng họ trở lại.
    return <Navigate to={`/${currentLang}/login`} state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render component con (children) nếu được truyền vào,
  // hoặc render <Outlet /> để render các route con lồng nhau.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;