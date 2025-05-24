// src/main.jsx (User Frontend)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { HelmetProvider } from 'react-helmet-async';

import AppUser from './AppUser.jsx';
import apolloClientUser from './api/apolloClientUser.js';

// 1. QUAN TRỌNG: Import file cấu hình i18next của bạn
import './i18nUser.js';

// CSS Imports
import 'bootstrap/dist/css/bootstrap.min.css';
// << THÊM DÒNG NÀY ĐỂ IMPORT JAVASCRIPT CỦA BOOTSTRAP >>
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import './styles/indexUser.css'; // Hoặc index.css nếu dùng chung

// Context Providers
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';

// Fallback UI cho Suspense
const GlobalLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-family-sans-serif)'}}>
    Đang tải ứng dụng... {/* Sẽ được dịch sau */}
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <React.Suspense fallback={<GlobalLoadingFallback />}>
      <ApolloProvider client={apolloClientUser}>
        <BrowserRouter>
          <HelmetProvider>
            <AuthProvider>
              <CartProvider>
                <AppUser />
              </CartProvider>
            </AuthProvider>
          </HelmetProvider>
        </BrowserRouter>
      </ApolloProvider>
    </React.Suspense>
  </React.StrictMode>
);