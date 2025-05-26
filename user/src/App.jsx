import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import client from './services/apolloClient'; // Đường dẫn tới Apollo Client
import { AuthProvider } from './contexts/AuthContext'; // AuthProvider
import { CartProvider } from './contexts/CartContext'; // CartProvider

// Layouts
import MainLayout from './components/layout/MainLayout'; // Layout chính

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';

// Routes
import ProtectedRoute from './routes/ProtectedRoute'; // Component ProtectedRoute

// Pages (sử dụng React.lazy để code-splitting)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductListingPage = React.lazy(() => import('./pages/ProductListingPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductListingPage')); // Ví dụ trang chi tiết sản phẩm
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage')); // Ví dụ trang đăng ký
const ForgotPasswordPage = React.lazy(() => import('./pages/Auth/ForgotPasswordPage')); // Ví dụ
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage')); // Ví dụ

// Protected Pages (ví dụ)
const AccountLayout = React.lazy(() => import('./pages/Account/AccountLayout')); // Layout cho trang tài khoản
const ProfilePage = React.lazy(() => import('./pages/Account/ProfilePage'));
const OrderHistoryPage = React.lazy(() => import('./pages/Account/OrderHistoryPage'));
const OrderDetailPage = React.lazy(() => import('./pages/Account/OrderDetailPage'));

const CartPage = React.lazy(() => import('./pages/CartPage')); // Trang giỏ hàng
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage')); // Trang thanh toán (cần bảo vệ)

const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage')); // Trang 404

import './App.css'; // Hoặc các file CSS global khác

function App() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><LoadingSpinner /></div>}>
      <ApolloProvider client={client}>
        <Router>
          <AuthProvider>
            <CartProvider>
              <Routes>
                {/* Public Routes within MainLayout */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductListingPage />} />
                  <Route path="product/:slug" element={<ProductDetailPage />} /> {/* :slug or :id */}
                  <Route path="cart" element={<CartPage />} />
                  
                  {/* Authentication Routes */}
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="reset-password/:token" element={<ResetPasswordPage />} /> {/* :token là param */}

                  {/* Protected Routes */}
                  <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                  
                  <Route path="account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                    {/* Nested protected routes for account section */}
                    <Route index element={<ProfilePage />} /> {/* Mặc định của /account */}
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="orders" element={<OrderHistoryPage />} />
                    <Route path="orders/:orderId" element={<OrderDetailPage />} />
                    {/* Thêm các route khác cho trang tài khoản nếu có */}
                  </Route>
                  
                  {/* Fallback for unknown routes */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
                
                {/* Routes không sử dụng MainLayout (nếu có, ví dụ trang landing page đặc biệt) */}
                {/* <Route path="/special-landing" element={<SpecialLandingPage />} /> */}
              </Routes>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ApolloProvider>
    </Suspense>
  );
}

export default App;