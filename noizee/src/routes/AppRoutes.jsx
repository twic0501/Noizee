import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import MainLayout from '../components/layout/MainLayout';
import AuthPageLayout from '../components/layout/AuthPageLayout';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load các Page components
const HomePage = lazy(() => import('../pages/HomePage'));
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));

const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'));

const ProfilePage = lazy(() => import('../pages/Account/ProfilePage'));
const OrderDetailPage = lazy(() => import('../pages/Account/OrderDetailPage'));

const BlogListPage = lazy(() => import('../pages/Blog/BlogListPage'));
const BlogPostDetailPage = lazy(() => import('../pages/Blog/BlogPostDetailPage'));
const BlogCategoryPage = lazy(() => import('../pages/Blog/BlogCategoryPage'));
const BlogTagPage = lazy(() => import('../pages/Blog/BlogTagPage'));

const TheNoizeePage = lazy(() => import('../pages/TheNoizeePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => {
    // Props như setIsCartPanelOpen sẽ được truyền từ App.jsx nếu MainLayout cần
    // hoặc các component con như Header sẽ lấy trực tiếp từ Context.
    // Hiện tại, MainLayout và Header được thiết kế để lấy state từ context.

    return (
        <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
                {/* Public Routes with MainLayout */}
                <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
                <Route path="/collections" element={<MainLayout><CollectionsPage /></MainLayout>} />
                <Route path="/collections/category/:categorySlug" element={<MainLayout><CollectionsPage /></MainLayout>} /> {/* Lọc theo category */}
                <Route path="/collections/tag/:tagSlug" element={<MainLayout><CollectionsPage /></MainLayout>} /> {/* Lọc theo tag sản phẩm nếu có */}
                <Route path="/product/:slugOrId" element={<MainLayout><ProductDetailPage /></MainLayout>} />
                <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />

                {/* Blog Routes with MainLayout */}
                <Route path="/blog" element={<MainLayout><BlogListPage /></MainLayout>} />
                <Route path="/blog/post/:postSlugOrId" element={<MainLayout><BlogPostDetailPage /></MainLayout>} />
                <Route path="/blog/category/:categorySlug" element={<MainLayout><BlogCategoryPage /></MainLayout>} />
                <Route path="/blog/tag/:tagSlug" element={<MainLayout><BlogTagPage /></MainLayout>} />

                {/* Static Pages with MainLayout */}
                <Route path="/the-noizee" element={<MainLayout><TheNoizeePage /></MainLayout>} />
                <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />

                {/* Auth Routes with AuthPageLayout (hoặc không có layout nếu AuthPageLayout là self-contained) */}
                {/* Nếu AuthPageLayout đã bao gồm nền và logo, thì không cần bọc nó nữa */}
                <Route path="/login" element={<AuthPageLayout title="Đăng Nhập"><LoginPage /></AuthPageLayout>} />
                <Route path="/register" element={<AuthPageLayout title="Tạo Tài Khoản"><RegisterPage /></AuthPageLayout>} />
                <Route path="/forgot-password" element={<AuthPageLayout title="Quên Mật Khẩu"><ForgotPasswordPage /></AuthPageLayout>} />
                <Route path="/reset-password/:token" element={<AuthPageLayout title="Đặt Lại Mật Khẩu"><ResetPasswordPage /></AuthPageLayout>} />


                {/* Protected Routes - Cần đăng nhập */}
                <Route path="/checkout" element={
                    <ProtectedRoute>
                        <MainLayout><CheckoutPage /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/account" element={
                    <ProtectedRoute>
                        <MainLayout><ProfilePage /></MainLayout> {/* Trang Profile chính */}
                    </ProtectedRoute>
                } />
                <Route path="/account/profile" element={ // Route cụ thể hơn cho Profile nếu cần
                    <ProtectedRoute>
                        <MainLayout><ProfilePage /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/account/orders" element={ // Route cho danh sách đơn hàng
                    <ProtectedRoute>
                        <MainLayout><ProfilePage defaultTab="history" /></MainLayout> {/* Truyền prop để ProfilePage mở tab Lịch sử đơn hàng */}
                    </ProtectedRoute>
                } />
                <Route path="/account/orders/:orderId" element={
                    <ProtectedRoute>
                        <MainLayout><OrderDetailPage /></MainLayout>
                    </ProtectedRoute>
                } />
                 <Route path="/account/addresses" element={ // Route cho danh sách địa chỉ
                    <ProtectedRoute>
                        <MainLayout><ProfilePage defaultTab="addresses" /></MainLayout> {/* Truyền prop để ProfilePage mở tab Địa chỉ */}
                    </ProtectedRoute>
                } />

                {/* Not Found Route */}
                <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
                {/* Hoặc bạn có thể muốn NotFoundPage có layout riêng hoặc không có layout: */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;