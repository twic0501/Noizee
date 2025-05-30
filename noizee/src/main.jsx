import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';

import App from './App.jsx';
import client from './api/apolloClient.js';
import './i18n.js'; // Import file cấu hình i18n

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // JS cho Bootstrap components
import 'antd/dist/reset.css'; // CSS reset của Ant Design (nếu bạn dùng AntD version 5+)
// import 'antd/dist/antd.min.css'; // Hoặc file này cho AntD version 4

import './index.css';       // CSS global từ template Vite (chứa font Inter)
import './styles/global.css'; // CSS global tùy chỉnh của bạn

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);