import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Pages (Sử dụng lazy loading)
const HomePage = lazy(() => import('../pages/HomePage'));
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const AccessoriesPage = lazy(() => import('../pages/AccessoriesPage'));
const TheNoizeePage = lazy(() => import('../pages/TheNoizeePage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const AccountLayout = lazy(() => import('../pages/Account/AccountLayout'));
const ProfilePage = lazy(() => import('../pages/Account/ProfilePage'));
const OrderHistoryPage = lazy(() => import('../pages/Account/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('../pages/Account/OrderDetailPage')); // <<< THÊM IMPORT
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Fallback component khi chờ tải trang
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        Loading Page...
    </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Routes sử dụng Layout chính */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="accessories" element={<AccessoriesPage />} />
          <Route path="the-noizee" element={<TheNoizeePage />} />
          <Route path="cart" element={<CartPage />} />

          {/* Routes cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path="profile" element={<ProfilePage />} /> {/* Thêm route profile rõ ràng nếu muốn */}
              <Route path="orders" element={<OrderHistoryPage />} />
              {/* --- THÊM ROUTE CHI TIẾT ĐƠN HÀNG --- */}
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              {/* ------------------------------------ */}
              {/* <Route path="change-password" element={<ChangePasswordPage />} /> */}
            </Route>
          </Route>
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;