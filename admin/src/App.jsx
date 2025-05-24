    // admin-frontend/src/App.jsx
    import React from 'react';
    import AppRoutes from './routes'; // Đảm bảo đường dẫn đúng (thường là './routes/index.jsx')

    // Import CSS toàn cục ở đây hoặc trong main.jsx
    // import 'bootstrap/dist/css/bootstrap.min.css';
    // import 'bootstrap-icons/font/bootstrap-icons.css';
    // import './styles/index.css'; // Nếu có file styles/index.css

    function App() {
      return (
        <>
          <AppRoutes />
        </>
      );
    }

    export default App;
    