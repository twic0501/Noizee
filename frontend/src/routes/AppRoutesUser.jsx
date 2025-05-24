// src/routes/AppRoutesUser.jsx (User Frontend)
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Giả sử bạn có các component layout và page sau (cần tạo nếu chưa có)
// import UserLayout from '../components/layout/UserLayout'; 
// import HomePage from '../pages/user/HomePage';
// import ProductListPageUser from '../pages/user/ProductListPageUser';
// import ProductDetailPageUser from '../pages/user/ProductDetailPageUser';
// import UserNotFoundPage from '../pages/user/UserNotFoundPage';

// --- Ví dụ Lazy Loading ---
const UserLayout = lazy(() => import('../components/layout/UserLayout'));
const HomePage = lazy(() => import('../pages/user/HomePage'));
const ProductListPageUser = lazy(() => import('../pages/user/ProductListPageUser'));
const ProductDetailPageUser = lazy(() => import('../pages/user/ProductDetailPageUser'));
const UserNotFoundPage = lazy(() => import('../pages/user/UserNotFoundPage'));
// --- Kết thúc ví dụ Lazy Loading ---

const LoadingFallbackUser = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    {/* Bạn có thể dùng LoadingSpinner component nếu đã có */}
    Đang tải trang... 
  </div>
);

// Component trung gian để xử lý và áp dụng ngôn ngữ từ URL
const LanguageAwareLayout = ({ children }) => {
  const { lang } = useParams(); // Lấy 'vi' hoặc 'en' từ URL
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Nếu ngôn ngữ trong URL khác với ngôn ngữ hiện tại của i18next
    // và ngôn ngữ đó được hỗ trợ, thì thay đổi ngôn ngữ của i18next.
    if (lang && i18n.language !== lang && i18n.options.supportedLngs.includes(lang)) {
      i18n.changeLanguage(lang);
      // LanguageDetector (nếu cấu hình caches: ['localStorage']) sẽ tự động cập nhật localStorage.
      // Hoặc bạn có thể tự cập nhật: localStorage.setItem('user_preferred_lang', lang);
    }
  }, [lang, i18n]);

  // Nếu tham số :lang trong URL không hợp lệ (không nằm trong supportedLngs)
  // Chuyển hướng người dùng về URL đúng với ngôn ngữ hiện tại của i18n (hoặc fallback)
  // và giữ nguyên phần còn lại của path.
  if (lang && !i18n.options.supportedLngs.includes(lang)) {
    // Xóa tiền tố ngôn ngữ không hợp lệ khỏi pathname
    const basePath = location.pathname.startsWith(`/${lang}`) 
                   ? location.pathname.substring(lang.length + 1) // +1 để bỏ dấu /
                   : location.pathname;
    return <Navigate to={`/${i18n.language}${basePath}${location.search}${location.hash}`} replace />;
  }

  // Children ở đây thường là <UserLayout /> hoặc trực tiếp <Outlet /> nếu UserLayout xử lý :lang
  return children; 
};

function AppRoutesUser() {
  const { i18n } = useTranslation();
  // Lấy ngôn ngữ mặc định/ưu tiên từ i18next (đã được LanguageDetector xử lý)
  const detectedOrDefaultLang = i18n.language || 'vi'; 

  return (
    <Suspense fallback={<LoadingFallbackUser />}>
      <Routes>
        {/* Route bao bọc tất cả các trang có tiền tố ngôn ngữ */}
        <Route path="/:lang" element={<LanguageAwareLayout><UserLayout /></LanguageAwareLayout>}>
          {/* UserLayout sẽ chứa <Outlet /> để render các trang con */}
          <Route index element={<HomePage />} /> {/* Trang chủ: /vi hoặc /en */}
          <Route path="products" element={<ProductListPageUser />} /> {/* /vi/products hoặc /en/products */}
          <Route path="products/:slug" element={<ProductDetailPageUser />} /> {/* :slug là slug sản phẩm */}
          
          {/* Thêm các routes khác cho User Frontend ở đây */}
          {/* Ví dụ:
          <Route path="collections" element={<CollectionListPageUser />} />
          <Route path="collections/:slug" element={<CollectionDetailPageUser />} />
          <Route path="blog" element={<BlogListPageUser />} />
          <Route path="blog/:slug" element={<BlogDetailPageUser />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="my-account" element={<MyAccountPage />} /> 
          */}
          
          <Route path="404" element={<UserNotFoundPage />} /> {/* Trang 404 cụ thể cho user */}
          <Route path="*" element={<Navigate to="404" replace />} /> {/* Bất kỳ path nào không khớp trong /:lang sẽ về 404 của lang đó */}
        </Route>

        {/* Chuyển hướng từ root (/) sang URL có tiền tố ngôn ngữ mặc định/đã phát hiện */}
        <Route path="/" element={<Navigate to={`/${detectedOrDefaultLang}`} replace />} />
        
        {/* Route 404 chung nếu truy cập path không có tiền tố ngôn ngữ và không phải là root */}
        {/* Có thể dẫn về trang 404 của ngôn ngữ mặc định hoặc một trang 404 chung không layout */}
        <Route path="*" element={<Navigate to={`/${detectedOrDefaultLang}/404`} replace />} /> 
      </Routes>
    </Suspense>
  );
}

export default AppRoutesUser;
