// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner'; // Tạo component này

// Sử dụng React.lazy để code-splitting các trang
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListingPage = lazy(() => import('../src/pages/ProductListingPage')); // Sẽ tạo sau
//const ProductDetailPage = lazy(() => import('../src/pages/ProductDetailPage')); // Sẽ tạo sau
const CartPage = lazy(() => import('./pages/CartPage')); // Sẽ tạo sau
const CheckoutPage = lazy(() => import('./pages/CheckoutPage')); // Sẽ tạo sau
const LoginPage = lazy(() => import('./pages/Auth/LoginPage')); // Sẽ tạo sau
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage')); // Sẽ tạo sau
const AccountPage = lazy(() => import('./pages/Account/AccountLayout')); // Sẽ tạo sau (layout cho các trang tài khoản)
const BlogListPage = lazy(() => import('./pages/Blog/BlogListPage')); // Sẽ tạo sau
const BlogPostPage = lazy(() => import('./pages/Blog/BlogPostPage')); // Sẽ tạo sau
const NotFoundPage = lazy(() => import('./pages/NotFoundPage')); // Sẽ tạo sau (dùng FuzzyText)
const CollectionsPage = lazy(() => import('./pages/CollectionsPage')); // Sẽ tạo sau

// Tạo các file component trang cơ bản (ví dụ HomePage, NotFoundPage)
// src/pages/HomePage.jsx
// const HomePage = () => <div className="text-xl">Chào mừng đến với Noizee!</div>;
// src/pages/NotFoundPage.jsx
// const NotFoundPage = () => <div className="text-xl">404 - Trang không tìm thấy</div>;


function App() {
  return (
    <Router>
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListingPage />} />
            <Route path="products/:productId" element={<ProductDetailPage />} /> {/* Sửa thành :productId */}
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="collections/:collectionSlug" element={<ProductListingPage />} /> {/* Lọc sản phẩm theo collection */}
            <Route path="categories/:categorySlugOrId" element={<ProductListingPage />} /> {/* Lọc sản phẩm theo category */}


            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />

            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            {/* <Route path="forgot-password" element={<ForgotPasswordPage />} /> */}
            {/* <Route path="reset-password/:token" element={<ResetPasswordPage />} /> */}

            <Route path="account" element={<AccountPage />}>
              {/* <Route index element={<ProfilePage />} /> */}
              {/* <Route path="orders" element={<OrderHistoryPage />} /> */}
              {/* <Route path="orders/:orderId" element={<OrderDetailPage />} /> */}
            </Route>

            <Route path="blog" element={<BlogListPage />} />
            <Route path="blog/:postSlug" element={<BlogPostPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
export default App;