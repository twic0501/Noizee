// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { I18nextProvider } from 'react-i18next';


// import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Bootstrap JS (nếu cần)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import client from './services/apolloClient';
import i18n from '../i18n'; // Đường dẫn tới file i18n của bạn
import MainRouter from './routes';

import './index.css'; // Nơi bạn định nghĩa @font-face, CSS variables và áp dụng font

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ApolloProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MainRouter />
        </I18nextProvider>
      </ApolloProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found. App cannot be mounted.");
}