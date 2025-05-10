import React from 'react';
import AppRoutes from './routes/index.jsx'; // Import cấu hình routes

function App() {
  // Component App có thể chứa các logic toàn cục khác nếu cần,
  // nhưng thường chỉ render Routes là đủ cho trang admin này.
  return (
    <>
      {/* Render bộ định tuyến */}
      <AppRoutes />
    </>
  );
}

export default App;