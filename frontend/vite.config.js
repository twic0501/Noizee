// File: vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Sử dụng SWC

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Port cho frontend dev server (mặc định Vite)
    open: true, // Tự mở trình duyệt khi chạy dev
    // Proxy không thực sự cần thiết nếu bạn gọi trực tiếp endpoint GraphQL
    // từ Apollo Client sử dụng biến môi trường VITE_GRAPHQL_ENDPOINT.
    // Bỏ comment nếu bạn cần proxy các API khác (ví dụ: REST API upload).
    // proxy: {
    //   '/api': { // Proxy các request bắt đầu bằng /api
    //     target: 'http://localhost:5000', // Địa chỉ backend server
    //     changeOrigin: true,
    //     // rewrite: (path) => path.replace(/^\/api/, '') // Bỏ '/api' nếu backend không có prefix này
    //   }
    // }
  },
  // Tùy chọn build khác nếu cần
  // build: {
  //   outDir: 'dist',
  // }
});