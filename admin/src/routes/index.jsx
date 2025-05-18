    // admin-frontend/src/routes/index.jsx
    import React, { Suspense, lazy } from 'react';
    import { Routes, Route, Navigate } from 'react-router-dom'; // Bỏ Outlet nếu không dùng trực tiếp ở đây
    import ProtectedRoute from './ProtectedRoute';
    import LoadingSpinner from '../components/common/LoadingSpinner'; // Sử dụng LoadingSpinner đã có

    // Layouts
    const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));

    // Pages
    const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
    const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));

    // Products
    const ProductListPage = lazy(() => import('../pages/Products/ProductListPage'));
    const ProductCreatePage = lazy(() => import('../pages/Products/ProductCreatePage'));
    const ProductEditPage = lazy(() => import('../pages/Products/ProductEditPage'));

    // Attributes Management
    const CategoryListPage = lazy(() => import('../pages/Categories/CategoryListPage'));
    const SizeListPage = lazy(() => import('../pages/Sizes/SizeListPage'));
    const ColorListPage = lazy(() => import('../pages/Colors/ColorListPage'));
    const CollectionListPage = lazy(() => import('../pages/Collections/CollectionListPage'));

    // Orders
    const OrderListPage = lazy(() => import('../pages/Orders/OrderListPage'));
    const OrderDetailsPage = lazy(() => import('../pages/Orders/OrderDetailsPage'));

    // Customers
    const CustomerListPage = lazy(() => import('../pages/Customers/CustomerListPage'));

    // === BLOG PAGES (MỚI) ===
    const BlogPostListPage = lazy(() => import('../pages/Blog/BlogPostListPage'));
    const BlogPostCreatePage = lazy(() => import('../pages/Blog/BlogPostCreatePage'));
    const BlogPostEditPage = lazy(() => import('../pages/Blog/BlogPostEditPage'));
    const BlogTagListPage = lazy(() => import('../pages/Blog/BlogTagListPage'));
    const BlogCommentListPage = lazy(() => import('../pages/Blog/BlogCommentListPage'));
    // === KẾT THÚC BLOG PAGES ===

    // Marketing (Placeholders)
    const NotificationListPage = lazy(() => import('../pages/Marketing/Notifications/NotificationListPage'));
    const EmailManagementPage = lazy(() => import('../pages/Marketing/Emails/EmailManagementPage'));

    // Settings (Placeholders)
    const GeneralSettingsPage = lazy(() => import('../pages/Settings/GeneralSettingsPage'));
    const AdminAccountsPage = lazy(() => import('../pages/Settings/AdminAccountsPage'));

    // 404
    const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

    // Component hiển thị trong khi chờ tải lazy component
    const LoadingFallback = () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
            <LoadingSpinner message="Đang tải trang quản trị..." />
        </div>
    );

    function AppRoutes() {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<AdminLayout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />

                            <Route path="products">
                                <Route index element={<ProductListPage />} />
                                <Route path="new" element={<ProductCreatePage />} />
                                <Route path="edit/:id" element={<ProductEditPage />} />
                            </Route>

                            <Route path="categories" element={<CategoryListPage />} />
                            <Route path="sizes" element={<SizeListPage />} />
                            <Route path="colors" element={<ColorListPage />} />
                            <Route path="collections" element={<CollectionListPage />} />

                            {/* === BLOG ROUTES (MỚI) === */}
                            <Route path="blog">
                                <Route path="posts" element={<BlogPostListPage />} />
                                <Route path="posts/new" element={<BlogPostCreatePage />} />
                                <Route path="posts/edit/:id" element={<BlogPostEditPage />} />
                                <Route path="tags" element={<BlogTagListPage />} />
                                <Route path="comments" element={<BlogCommentListPage />} />
                                {/* Redirect từ /blog về /blog/posts nếu cần */}
                                <Route index element={<Navigate to="posts" replace />} />
                            </Route>
                            {/* === KẾT THÚC BLOG ROUTES === */}

                            <Route path="orders">
                                <Route index element={<OrderListPage />} />
                                <Route path=":id" element={<OrderDetailsPage />} /> {/* Sửa: :id thay vì details/:id */}
                            </Route>

                            <Route path="customers" element={<CustomerListPage />} />

                            <Route path="marketing">
                                <Route path="notifications" element={<NotificationListPage />} />
                                <Route path="emails" element={<EmailManagementPage />} />
                            </Route>

                            <Route path="settings">
                                <Route path="general" element={<GeneralSettingsPage />} />
                                <Route path="admins" element={<AdminAccountsPage />} />
                            </Route>
                            
                            {/* Catch-all bên trong AdminLayout nên điều hướng về dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Route>

                    {/* Route 404 chung cho các đường dẫn không khớp */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        );
    }

    export default AppRoutes;
    