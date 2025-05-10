// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import App from './App.jsx';
import apolloClient from './api/apolloClient.js'; // Client Apollo đã cấu hình
import { AuthProvider } from './contexts/AuthContext.jsx'; // Auth Provider
import { CartProvider } from './contexts/CartContext.jsx'; // Cart Provider

// --- CSS Imports ---
// 1. Bootstrap CSS (Quan trọng!)
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Bootstrap Icons CSS (Nếu dùng)
import 'bootstrap-icons/font/bootstrap-icons.css';
// 3. Theme Variables (CSS Vars)
import './styles/theme.css';
// 4. Global Styles (Sau Bootstrap và Theme)
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Cung cấp Apollo Client cho toàn bộ ứng dụng */}
    <ApolloProvider client={apolloClient}>
      {/* Cung cấp Contexts */}
      <AuthProvider>
        <CartProvider>
          {/* Cung cấp Router */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>,
);