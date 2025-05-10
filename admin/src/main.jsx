// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import App from './App.jsx';
import apolloClient from './api/apolloClient.js'; // Client Apollo đã cấu hình cho admin
import { AuthProvider } from './contexts/AuthContext.jsx'; // AuthProvider của admin

// --- CSS Imports ---
// 1. Import Bootstrap CSS (Quan trọng!) - **ĐẶT LÊN ĐẦU TIÊN**
import 'bootstrap/dist/css/bootstrap.min.css';

// 2. Import Bootstrap Icons CSS (Nếu bạn dùng)
import 'bootstrap-icons/font/bootstrap-icons.css';

// 3. Import CSS toàn cục của bạn (index.css) - **ĐẶT SAU BOOTSTRAP**
import './index.css'; // CSS global cho admin

// 4. Import App.css nếu bạn có dùng và nó chứa style cần thiết
// import './App.css';

// Render ứng dụng vào root DOM element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter> {/* Hoặc HashRouter tùy theo nhu cầu deploy */}
        <AuthProvider> {/* AuthProvider dành riêng cho admin */}
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);