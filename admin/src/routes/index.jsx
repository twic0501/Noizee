// src/routes/index.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

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
        {/* Bạn có thể dùng Spinner của Bootstrap ở đây */}
        {/* <Spinner animation="border" variant="primary" /> */}
        <p style={{fontSize: '1.2rem', color: '#6c757d'}}>Loading Admin Panel...</p>
    </div>
);

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Public Route for Admin Login */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Admin Routes with AdminLayout */}
                <Route element={<ProtectedRoute />}> {/* Áp dụng bảo vệ cho tất cả các route bên trong */}
                    <Route path="/" element={<AdminLayout />}> {/* Layout chung cho các trang admin */}
                        {/* Index route for admin root, redirects to dashboard */}
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        <Route path="dashboard" element={<DashboardPage />} />

                        {/* Product Routes */}
                        <Route path="products"> {/* Không cần Outlet ở đây nếu các route con đã có path riêng */}
                            <Route index element={<ProductListPage />} />
                            <Route path="new" element={<ProductCreatePage />} />
                            <Route path="edit/:id" element={<ProductEditPage />} />
                        </Route>

                        {/* Product Attributes Management Routes */}
                        <Route path="categories" element={<CategoryListPage />} />
                        <Route path="sizes" element={<SizeListPage />} />
                        <Route path="colors" element={<ColorListPage />} />
                        <Route path="collections" element={<CollectionListPage />} />

                        {/* Order Routes */}
                        <Route path="orders">
                            <Route index element={<OrderListPage />} />
                            <Route path=":id" element={<OrderDetailsPage />} />
                        </Route>

                        {/* Customer Route */}
                        <Route path="customers" element={<CustomerListPage />} />

                        {/* Marketing Routes (Placeholders) */}
                        <Route path="marketing">
                            <Route path="notifications" element={<NotificationListPage />} />
                            <Route path="emails" element={<EmailManagementPage />} />
                        </Route>

                        {/* Settings Routes (Placeholders) */}
                        <Route path="settings">
                            <Route path="general" element={<GeneralSettingsPage />} />
                            <Route path="admins" element={<AdminAccountsPage />} />
                        </Route>

                        {/* Catch-all for admin section - maybe redirect to dashboard or show a specific admin 404 */}
                        {/* Nên đặt cuối cùng trong block AdminLayout này */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        {/* Hoặc: <Route path="*" element={<AdminNotFoundPage />} /> */}
                    </Route>
                </Route>

                {/* Catch-all 404 Route for non-admin paths (nếu /login không khớp) */}
                {/* Đảm bảo route này nằm ngoài ProtectedRoute và AdminLayout nếu muốn nó áp dụng cho toàn bộ app */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;