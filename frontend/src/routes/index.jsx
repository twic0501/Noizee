// src/routes/index.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const AccountLayout = lazy(() => import('../pages/Account/AccountLayout'));

// Common Pages
const HomePage = lazy(() => import('../pages/HomePage')); // Trang chủ (New Arrivals)
const CollectionsPage = lazy(() => import('../pages/CollectionsPage')); // Trang danh sách sản phẩm chung
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Specific Collection/Category Pages (có thể dùng lại CollectionsPage với filter)
const AccessoriesPage = lazy(() => import('../pages/AccessoriesPage')); // Ví dụ trang phụ kiện
const TheNoizeePage = lazy(() => import('../pages/TheNoizeePage'));   // Ví dụ trang "The Noizee"

// Auth Pages
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'));

// Protected Pages
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const ProfilePage = lazy(() => import('../pages/Account/ProfilePage'));
const OrderHistoryPage = lazy(() => import('../pages/Account/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('../pages/Account/OrderDetailPage')); // Trang chi tiết đơn hàng

// Fallback component khi chờ tải trang
const LoadingFallback = () => (
  // Bạn có thể dùng LoadingSpinner component ở đây
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-background)' }}>
    <p style={{ fontFamily: 'var(--font-family-heading-sub)', color: 'var(--color-text-base)' }}>Loading...</p>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Routes sử dụng Layout chính (Header, Footer) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} /> {/* Trang chủ là New Arrivals */}
          <Route path="collections" element={<CollectionsPage />} />
          {/*
            Route cho các danh mục cụ thể, có thể dùng CollectionsPage với filter
            Ví dụ: /collections/clothing, /collections/shoes
            Hoặc tạo component riêng nếu layout/logic khác biệt nhiều
          */}
          <Route path="collections/:categorySlug" element={<CollectionsPage />} /> {/* Ví dụ filter theo category slug */}
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="accessories" element={<AccessoriesPage />} /> {/* Hoặc dùng /collections?category=accessories */}
          <Route path="the-noizee" element={<TheNoizeePage />} /> {/* Hoặc dùng /collections?collection=the-noizee */}
          <Route path="cart" element={<CartPage />} />

          {/* Routes cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} /> {/* Trang mặc định của /account */}
              {/* <Route path="profile" element={<ProfilePage />} /> Bỏ nếu index đã là profile */}
              <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} /> {/* Route chi tiết đơn hàng */}
              {/* <Route path="wishlist" element={<WishlistPage />} /> */}
              {/* <Route path="change-password" element={<ChangePasswordPage />} /> */}
            </Route>
          </Route>
        </Route>

        {/* Auth Routes (không dùng MainLayout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Thường có token trong URL query param */}

        {/* 404 Not Found - Nên đặt ở cuối cùng */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;