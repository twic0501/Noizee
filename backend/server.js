const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Load biến môi trường từ file .env

const http = require('http');                     // Module HTTP của Node.js
const createApp = require('./app');               // Import hàm tạo app Express đã cấu hình
const logger = require('./utils/logger');         // Import logger
const { connectDB } = require('./config/db');   // Import hàm kết nối DB

const PORT = process.env.PORT || 5000;            // Lấy cổng từ biến môi trường hoặc mặc định 5000
const NODE_ENV = process.env.NODE_ENV || 'development'; // Lấy môi trường hoạt động
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql'; // Lấy đường dẫn GraphQL

// Hàm async để khởi động server
const start = async () => {
  try {
    // Kết nối tới cơ sở dữ liệu
    logger.info('Attempting to connect to the database...'); //
    await connectDB(); // Gọi hàm kết nối DB và chờ hoàn thành
    logger.info('Database connection successful.'); //

    // Tạo ứng dụng Express
    logger.info('Creating Express app with Apollo Server...'); //
    const app = await createApp(); // Gọi hàm tạo app và chờ hoàn thành
    logger.info('Express app created successfully.'); //

    // Tạo HTTP server từ app Express
    const httpServer = http.createServer(app); //

    // Lắng nghe trên cổng đã định nghĩa
    httpServer.listen(PORT, () => { //
      logger.info(` 🚀  Server ready and listening on port ${PORT}`); //
      logger.info(`    - Mode: ${NODE_ENV}`); //
      logger.info(`    - API Base URL: http://localhost:${PORT}`); //
      logger.info(`    - GraphQL Endpoint: http://localhost:<span class="math-inline">\{PORT\}</span>{GRAPHQL_PATH}`); //
    }); //

    // Xử lý lỗi khi server lắng nghe (ví dụ: cổng đã được sử dụng)
    httpServer.on('error', (error) => { //
      if (error.syscall !== 'listen') throw error;
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      switch (error.code) {
        case 'EACCES': // Lỗi quyền truy cập
          logger.error(`${bind} requires elevated privileges`); //
          process.exit(1);
          break;
        case 'EADDRINUSE': // Lỗi cổng đã sử dụng
          logger.error(`${bind} is already in use`); //
          process.exit(1);
          break;
        default:
          throw error;
      }
    }); //

  } catch (error) { // Bắt lỗi trong quá trình khởi động (ví dụ: lỗi kết nối DB)
    logger.error(' 💥  Failed to start application server:'); //
    logger.error(error); //
    process.exit(1); // Thoát ứng dụng nếu khởi động thất bại
  }
};

// Bắt các lỗi unhandled rejection (lỗi promise không được catch)
process.on('unhandledRejection', (reason, promise) => { //
  console.error('Unhandled Rejection at:', promise, 'reason:', reason); //
  // Cân nhắc việc thoát ứng dụng ở đây tùy theo mức độ nghiêm trọng
  // throw reason;
}); //

// Bắt các lỗi uncaught exception (lỗi không được catch trong try-catch)
process.on('uncaughtException', (err) => { //
  logger.error('Uncaught Exception:', err.message); //
  logger.error(err.stack); //
  process.exit(1); // Thoát ứng dụng khi gặp lỗi nghiêm trọng không xử lý được
}); //

// Gọi hàm để bắt đầu server
start(); //