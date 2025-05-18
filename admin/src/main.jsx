    // admin-frontend/src/main.jsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { BrowserRouter } from 'react-router-dom'; // Hoặc HashRouter
    import { ApolloProvider } from '@apollo/client';
    import App from './App.jsx';
    import apolloClient from './api/apolloClient.js';
    import { AuthProvider } from './contexts/AuthContext.jsx';
    // import { LanguageProvider } from './contexts/LanguageContext.jsx'; // Bỏ comment nếu bạn tạo LanguageProvider

    // CSS Imports
    import 'bootstrap/dist/css/bootstrap.min.css';
    import 'bootstrap-icons/font/bootstrap-icons.css';
    import './index.css'; // CSS global của bạn (nếu có, đảm bảo file này tồn tại)
    // import './App.css'; // Nếu bạn dùng App.css

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ApolloProvider client={apolloClient}>
          <BrowserRouter>
            <AuthProvider>
              {/* <LanguageProvider> */}
                <App />
              {/* </LanguageProvider> */}
            </AuthProvider>
          </BrowserRouter>
        </ApolloProvider>
      </React.StrictMode>,
    );
    