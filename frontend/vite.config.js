// vite.config.js (trong thư mục gốc của noizee-user-frontend)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Hoặc @vitejs/plugin-react

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Bạn có thể đổi port nếu muốn, ví dụ 3000 cho user-frontend
    open: true, // Tự động mở trình duyệt khi chạy `npm run dev`
    // Proxy API requests (ví dụ: cho việc upload ảnh hoặc các API REST khác)
    // GraphQL requests thường được xử lý trực tiếp bởi Apollo Client với VITE_GRAPHQL_ENDPOINT
    proxy: {
      // Ví dụ: nếu bạn có API upload tại '/api/uploads' trên backend
      '/api/uploads': { // Chỉ proxy các request bắt đầu bằng /api/uploads
        target: 'http://localhost:5000', // Địa chỉ backend server
        changeOrigin: true, // Cần thiết cho virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api\/uploads/, '/api/uploads') // Giữ nguyên path nếu backend cũng có /api/uploads
                                                                          // Hoặc path.replace(/^\/api\/uploads/, '/uploads') nếu backend là /uploads
      },
      // Nếu bạn có các API REST khác, ví dụ /api/auth (mặc dù bạn đang dùng GraphQL cho auth)
      // '/api': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      // }
    }
  },
  build: {
    outDir: 'dist', // Thư mục output khi build
    sourcemap: true, // Tạo sourcemap cho production build (tùy chọn)
  },
  // Tùy chọn để define biến global từ .env (nếu không muốn dùng import.meta.env trực tiếp ở mọi nơi)
  // define: {
  //   'process.env.VITE_GRAPHQL_ENDPOINT': JSON.stringify(process.env.VITE_GRAPHQL_ENDPOINT),
  //   'process.env.VITE_BACKEND_BASE_URL': JSON.stringify(process.env.VITE_BACKEND_BASE_URL),
  // }
});