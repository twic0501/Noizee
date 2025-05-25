// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import App from './App.jsx';
import client from './services/apolloClient.js';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx'; // Import CartProvider
import './index.css';
import '../i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <CartProvider> {/* Bọc CartProvider */}
          <App />
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>,
);