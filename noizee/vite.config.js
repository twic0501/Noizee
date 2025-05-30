import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Hoặc plugin-react nếu bạn không dùng SWC cụ thể

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Bạn có thể đổi cổng nếu muốn
    // Proxy API requests (nếu backend chạy trên domain khác và bạn gặp lỗi CORS khi dev)
    // proxy: {
    //   '/graphql': { // Hoặc bất kỳ path nào của API backend
    //     target: 'http://localhost:4000', // URL của backend server
    //     changeOrigin: true,
    //     // rewrite: (path) => path.replace(/^\/api/, '') // Nếu cần rewrite path
    //   }
    // }
  },
  // (Tùy chọn) Cấu hình path aliases cho import dễ dàng hơn khi dự án lớn
  // resolve: {
  //   alias: {
  //     '@': '/src', // Ví dụ: import MyComponent from '@/components/MyComponent'
  //     '@components': '/src/components',
  //     '@pages': '/src/pages',
  //     // ... các alias khác
  //   },
  // },
});