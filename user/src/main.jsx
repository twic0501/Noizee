import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { I18nextProvider } from 'react-i18next';

import client from './services/apolloClient'; // Apollo Client đã cấu hình
import i18n from '../i18n';                   // Cấu hình i18next
import MainRouter from './routes';           // MainRouter từ ./routes/index.jsx

import './index.css'; // Tailwind base và global styles
// import "react-image-gallery/styles/css/image-gallery.css"; // Import CSS cho react-image-gallery nếu dùng

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
  // Hoặc bạn có thể hiển thị một thông báo lỗi trên trang
  // document.body.innerHTML = '<div style="text-align: center; padding-top: 50px;"><h1>Application Error</h1><p>Root HTML element not found.</p></div>';
}