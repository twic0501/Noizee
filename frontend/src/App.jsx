// src/App.jsx
import React from 'react';
import AppRoutes from './routes/index.jsx'; // Import cấu hình routes
// import GlobalAlerts from './components/common/GlobalAlerts'; // Ví dụ nếu có component thông báo toàn cục

function App() {
  // Component App có thể chứa các logic toàn cục không thuộc context cụ thể,
  // hoặc các provider không tiện đặt trong main.jsx.
  // Tuy nhiên, với cấu trúc hiện tại, chỉ render AppRoutes là đủ.
  return (
    <>
      {/* <GlobalAlerts />  Ví dụ: Component hiển thị thông báo toast toàn cục */}
      <AppRoutes />
    </>
  );
}

export default App;