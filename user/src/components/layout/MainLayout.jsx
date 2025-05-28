// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Đã tạo/cập nhật
import Footer from './Footer'; // Sẽ tạo ở trên
// import Lanyard from '../common/Lanyard'; // Component này sẽ được tạo sau

const MainLayout = () => {
  return (
    // d-flex: Kích hoạt flexbox
    // flex-column: Sắp xếp các item con theo chiều dọc
    // min-vh-100: Chiều cao tối thiểu bằng 100% chiều cao của viewport, đảm bảo footer luôn ở cuối nếu nội dung ngắn
    // bg-light: Màu nền xám nhạt từ Bootstrap (tương tự bg-gray-50 của Tailwind)
    // Bạn có thể thay bg-light bằng bg-body-secondary (trong BS 5.3+) hoặc một class màu nền tùy chỉnh.
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Lanyard có thể được đặt ở đây để hiển thị trên tất cả các trang dùng MainLayout */}
      {/* <Lanyard /> */}

      <Header />

      {/* Phần nội dung chính của trang */}
      {/* `flex-grow-1` sẽ làm cho main content chiếm hết không gian dọc còn lại giữa Header và Footer */}
      <main className="flex-grow-1">
        <Outlet /> {/* Outlet sẽ render component của route con */}
      </main>

      <Footer />

      {/* Các component toàn cục khác, ví dụ: nút chat nổi */}
      {/* <FloatingChatIcon /> */}
    </div>
  );
};

export default MainLayout;