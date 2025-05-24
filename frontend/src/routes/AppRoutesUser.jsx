import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from './ProtectedRoute'; // Import ProtectedRoute

// Layouts
const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const AccountLayout = lazy(() => import('../pages/Account/AccountLayout'));

// Common Pages
const HomePage = lazy(() => import('../pages/HomePage'));
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage')); // Chung cho tất cả lỗi không tìm thấy

// Specific Collection/Category Pages (có thể dùng lại CollectionsPage với filter)
const AccessoriesPage = lazy(() => import('../pages/AccessoriesPage'));
const TheNoizeePage = lazy(() => import('../pages/TheNoizeePage'));

// Auth Pages
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'));

// Protected Pages
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const ProfilePage = lazy(() => import('../pages/Account/ProfilePage'));
const OrderHistoryPage = lazy(() => import('../pages/Account/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('../pages/Account/OrderDetailPage'));


// Fallback component khi chờ tải trang
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-background)' }}>
    <p style={{ fontFamily: 'var(--font-family-heading-sub)', color: 'var(--color-text-base)' }}>Loading...</p>
  </div>
);

// Component trung gian để xử lý và áp dụng ngôn ngữ từ URL
const LanguageAwareLayout = ({ children }) => {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (lang && i18n.language !== lang && i18n.options.supportedLngs.includes(lang)) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  if (lang && !i18n.options.supportedLngs.includes(lang)) {
    const basePath = location.pathname.startsWith(`/${lang}`) 
                   ? location.pathname.substring(lang.length + 1)
                   : location.pathname;
    return <Navigate to={`/${i18n.language}${basePath}${location.search}${location.hash}`} replace />;
  }
  return children; 
};

function AppRoutesUser() {
  const { i18n } = useTranslation();
  const detectedOrDefaultLang = i18n.language || 'vi'; 

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes (không dùng MainLayout nhưng vẫn cần LanguageAwareLayout để đọc :lang) */}
        <Route path="/:lang/login" element={<LanguageAwareLayout><LoginPage /></LanguageAwareLayout>} />
        <Route path="/:lang/register" element={<LanguageAwareLayout><RegisterPage /></LanguageAwareLayout>} />
        <Route path="/:lang/forgot-password" element={<LanguageAwareLayout><ForgotPasswordPage /></LanguageAwareLayout>} />
        <Route path="/:lang/reset-password" element={<LanguageAwareLayout><ResetPasswordPage /></LanguageAwareLayout>} />

        {/* Routes chính sử dụng MainLayout và có tiền tố ngôn ngữ */}
        <Route path="/:lang" element={<LanguageAwareLayout><MainLayout />
        </LanguageAwareLayout>}>
          <Route index element={<HomePage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:categorySlug" element={<CollectionsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="accessories" element={<AccessoriesPage />} />
          <Route path="the-noizee" element={<TheNoizeePage />} />
          <Route path="cart" element={<CartPage />} />
          
          {/* Routes cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
            </Route>
          </Route>
          
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="404" replace />} />
        </Route>

        <Route path="/" element={<Navigate to={`/${detectedOrDefaultLang}`} replace />} />
        <Route path="*" element={<Navigate to={`/${detectedOrDefaultLang}/404`} replace />} /> 
      </Routes>
    </Suspense>
  );
}

export default AppRoutesUser;