import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AccountLayout from '../components/layout/AccountLayout'; // Đã đề xuất tạo

// Pages (import các component trang đã được lazy load hoặc sẽ được tạo)
// Common Pages
const HomePage = React.lazy(() => import('../pages/HomePage'));
const ProductListingPage = React.lazy(() => import('../pages/ProductListingPage'));
const CollectionProductsPage = React.lazy(() => import('../pages/CollectionProductsPage'));
const CategoryProductsPage = React.lazy(() => import('../pages/CategoryProductsPage'));
const ProductDetailPage = React.lazy(() => import('../pages/ProductDetailPage'));
const CartPage = React.lazy(() => import('../pages/CartPage'));
const CheckoutPage = React.lazy(() => import('../pages/CheckoutPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
// const TheNoizeePage = React.lazy(() => import('../pages/TheNoizeePage')); // Từ frontend/, nếu cần

// Auth Pages
const LoginPage = React.lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/Auth/ResetPasswordPage'));

// Account Pages (Protected)
const ProfilePage = React.lazy(() => import('../pages/Account/ProfilePage'));
const OrderHistoryPage = React.lazy(() => import('../pages/Account/OrderHistoryPage'));
const OrderDetailPage = React.lazy(() => import('../pages/Account/OrderDetailPage'));

// Blog Pages (MỚI)
const BlogListPage = React.lazy(() => import('../pages/Blog/BlogListPage'));
const BlogPostDetailPage = React.lazy(() => import('../pages/Blog/BlogPostDetailPage'));
const BlogCategoryPage = React.lazy(() => import('../pages/Blog/BlogCategoryPage')); // Trang bài viết theo category blog
const BlogTagPage = React.lazy(() => import('../pages/Blog/BlogTagPage'));       // Trang bài viết theo tag blog


// ProtectedRoute HOC
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Các route sử dụng MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Product Listing Routes */}
        <Route path="products" element={<ProductListingPage />} />
        <Route path="collections/:collectionSlug" element={<CollectionProductsPage />} />
        <Route path="categories/:categorySlug" element={<CategoryProductsPage />} />
        <Route path="product/:productSlug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        {/* <Route path="the-noizee" element={<TheNoizeePage />} />  // Từ frontend/, nếu cần */}
        {/* XÓA BỎ ROUTE /accessories */}

        {/* Blog Routes (MỚI) */}
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/:postSlug" element={<BlogPostDetailPage />} /> {/* Hoặc blog/post/:postId */}
        <Route path="blog/category/:categorySlug" element={<BlogCategoryPage />} />
        <Route path="blog/tag/:tagSlug" element={<BlogTagPage />} />


        {/* Authentication Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        
        <Route path="account" element={
          <ProtectedRoute>
            <AccountLayout /> 
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;