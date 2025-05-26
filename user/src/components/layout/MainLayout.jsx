import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Đã tạo/cập nhật
import Footer from './Footer'; // Sẽ tạo ở trên
// import Lanyard from '../common/Lanyard'; // Component này sẽ được tạo sau
// import FloatingChatIcon from '../common/FloatingChatIcon'; // Nếu bạn có component này

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* Thêm màu nền chung nếu muốn */}
      {/* Lanyard có thể được đặt ở đây để hiển thị trên tất cả các trang dùng MainLayout */}
      {/* <Lanyard /> */}
      
      <Header />

      {/* Phần nội dung chính của trang */}
      {/* `container mx-auto px-4` có thể được đặt ở đây nếu muốn giới hạn chiều rộng chung,
          hoặc để từng trang tự quản lý container của mình.
          Để linh hoạt, thường để từng trang tự quản lý.
      */}
      <main className="flex-grow"> 
        {/* Ví dụ: Thêm một lớp container chung nếu muốn: 
            <div className="container mx-auto px-4 py-8">
                <Outlet />
            </div>
        Nhưng thường Outlet sẽ render toàn bộ component trang, và trang đó sẽ tự có padding/container.
        */}
        <Outlet /> {/* Outlet sẽ render component của route con */}
      </main>

      <Footer />

      {/* Các component toàn cục khác, ví dụ: nút chat nổi */}
      {/* <FloatingChatIcon /> */}
    </div>
  );
};

export default MainLayout;