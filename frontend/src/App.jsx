// src/App.jsx
import React from 'react';
import AppRoutes from './routes/index.jsx'; // Import cấu hình routes

function App() {
  // Component App thường chỉ render Routes hoặc thêm các logic toàn cục không thuộc context cụ thể
  return (
    <>
      {/* Có thể thêm component Notification toàn cục ở đây */}
      <AppRoutes />
    </>
  );
}

export default App;