// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';

import App from './App.jsx';
import apolloClient from './api/apolloClient.js'; // Client Apollo đã cấu hình
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';

// --- CSS Imports ---
// 1. Reset CSS hoặc Normalize.css (Tùy chọn, nếu bạn không dùng reset của Bootstrap)
// import './styles/normalize.css';

// 2. Bootstrap CSS (Quan trọng!) - Đặt gần như đầu tiên
import 'bootstrap/dist/css/bootstrap.min.css';

// 3. Bootstrap Icons CSS (Nếu bạn dùng)
import 'bootstrap-icons/font/bootstrap-icons.css';

// 4. Theme Variables (CSS Vars) - Chứa định nghĩa font, màu sắc global
import './styles/theme.css';

// 5. Global Styles (Sau Bootstrap và Theme) - Áp dụng các style chung, override Bootstrap nếu cần
import './styles/index.css';

// 6. App.css (Nếu bạn có style cụ thể cho App component, thường thì không cần nhiều ở đây)
// import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter> {/* Đảm bảo BrowserRouter bọc AuthProvider và CartProvider nếu chúng dùng navigate */}
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);