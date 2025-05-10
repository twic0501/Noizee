import { defineConfig, loadEnv } from 'vite'; // Thêm loadEnv nếu cần truy cập biến môi trường ở đây
import react from '@vitejs/plugin-react-swc'; // Sử dụng SWC plugin cho React (nhanh hơn Babel)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load biến môi trường cho mode hiện tại (development, production)
  // Biến môi trường trong file .env cần có prefix VITE_ để được expose ra client
  // const env = loadEnv(mode, process.cwd(), ''); // process.cwd() là thư mục gốc dự án

  return {
    plugins: [react()],
    server: {
      port: 5173, // Port cho admin frontend dev server (có thể đổi nếu cần)
      open: true, // Tự động mở trình duyệt khi chạy dev server
      proxy: {
        // Proxy các request từ admin frontend đến backend server
        // Quan trọng nếu admin frontend và backend chạy trên các port khác nhau ở local
        // và bạn muốn tránh lỗi CORS khi gọi API không phải GraphQL (ví dụ: upload)
        // hoặc nếu bạn không muốn expose trực tiếp URL backend trong code client
        // (mặc dù với VITE_BACKEND_BASE_URL thì URL backend vẫn có trong client build).

        // Ví dụ: proxy cho API upload ảnh
        '/api/uploads': { // Chỉ proxy các request bắt đầu bằng /api/uploads
          target: process.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000', // Lấy từ biến môi trường của Vite
          changeOrigin: true, // Cần thiết cho virtual hosted sites
          // secure: false, // Bỏ comment nếu backend dùng HTTPS tự ký (self-signed cert) ở local
          // rewrite: (path) => path.replace(/^\/api\/uploads/, '/api/uploads') // Giữ nguyên path sau /api/uploads
                                                                             // Hoặc nếu backend không có prefix /api/uploads:
                                                                             // path.replace(/^\/api\/uploads/, '/uploads')
          // Log proxy requests (tùy chọn)
          // configure: (proxy, options) => {
          //   proxy.on('proxyReq', (proxyReq, req, res) => {
          //     console.log(`[Proxy Req] ${req.method} ${req.url} -> ${options.target}${proxyReq.path}`);
          //   });
          //   proxy.on('proxyRes', (proxyRes, req, res) => {
          //     console.log(`[Proxy Res] ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
          //   });
          //   proxy.on('error', (err, req, res) => {
          //     console.error('[Proxy Error]', err);
          //   });
          // }
        },
        // Proxy cho GraphQL endpoint (TÙY CHỌN - thường Apollo Client gọi thẳng qua VITE_GRAPHQL_ENDPOINT)
        // Chỉ cần nếu bạn muốn tất cả request (bao gồm cả GraphQL) đều đi qua proxy của Vite dev server.
        // '/graphql': {
        //   target: process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
        //   changeOrigin: true,
        //   // rewrite: (path) => path.replace(/^\/graphql/, '/graphql') // Thường backend đã có path /graphql
        // }
      }
    },
    build: {
      outDir: 'dist', // Thư mục output cho production build
      // Thêm các tùy chọn build khác nếu cần: sourcemap, chunkSizeWarningLimit, etc.
      // sourcemap: true, // Tạo source map cho production build (hữu ích khi debug)
    },
    // (Tùy chọn) Define global constants
    // define: {
    //   // Ví dụ: 'APP_VERSION': JSON.stringify(process.env.npm_package_version)
    //   // Cần đảm bảo biến này được định nghĩa trong môi trường build
    // }
  };
});