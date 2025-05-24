// ecosystem.config.js
module.exports = {
  apps : [{
    name   : "backend", // Đặt tên cho ứng dụng của bạn
    script : "./server.js",             // Đường dẫn đến file khởi động server.js
    instances: "max",                   // Chạy số instance bằng số CPU core khả dụng (hoặc "max")
                                        // PM2 sẽ tự động trừ đi 1 core cho hệ điều hành nếu dùng "max"
    exec_mode: "cluster",               // Bắt buộc phải có khi instances > 1 hoặc "max"
    watch  : false,                     // TẮT "watch" ở production. Watch dùng để tự restart khi file thay đổi (hữu ích cho dev).
    ignore_watch: ["node_modules", "logs", "public/uploads"], // Các thư mục bỏ qua khi watch (nếu watch được bật)
    max_memory_restart: "300M",         // Tự động restart nếu ứng dụng dùng quá 300MB RAM (điều chỉnh nếu cần)
    
    // Cấu hình biến môi trường
    // PM2 sẽ nạp các biến này khi khởi chạy với cờ --env tương ứng
    // Lưu ý: Các biến này có thể ghi đè lên các biến trong file .env của bạn
    env_production: {
       NODE_ENV: "production",
       PORT: process.env.PORT || 8080, // Cổng cho production, có thể lấy từ .env gốc hoặc đặt cứng ở đây
       // QUAN TRỌNG: Thêm tất cả các biến môi trường cần thiết cho production ở đây
       // Ví dụ:
       // JWT_SECRET: "your_production_jwt_secret", // Nên lấy từ biến môi trường của server hoặc hệ thống quản lý secret
       // DB_HOST: "your_production_db_host",
       // DB_USER: "your_production_db_user",
       // DB_PASSWORD: "your_production_db_password",
       // DB_NAME: "salesdb",
       // DB_PORT: 3306,
       // DB_DIALECT: "mysql",
       // GRAPHQL_PATH: "/graphql",
       // FRONTEND_URL: "https://yourdomain.com",
       // GOOGLE_CLIENT_ID: "your_google_client_id_for_prod",
       // GOOGLE_CLIENT_SECRET: "your_google_client_secret_for_prod",
       // GOOGLE_CALLBACK_URL: "https://your_api_domain.com/api/auth/google/callback",
       // SEQUELIZE_LOGGING: "false", // Tắt logging của Sequelize ở production
    },
    env_development: { // Cấu hình cho môi trường development (nếu bạn dùng PM2 cho dev)
       NODE_ENV: "development",
       PORT: process.env.PORT || 5000,
       // Các biến môi trường khác cho development
       // JWT_SECRET: "your_development_jwt_secret",
       // SEQUELIZE_LOGGING: "true",
    },

    // Cấu hình log của PM2 (tùy chọn, PM2 mặc định đã quản lý log khá tốt)
    // output: './logs/pm2-out.log',      // Đường dẫn file log cho stdout
    // error: './logs/pm2-error.log',     // Đường dẫn file log cho stderr
    // log_date_format: "YYYY-MM-DD HH:mm:ss Z", // Định dạng thời gian trong log
    // merge_logs: true,                  // Gộp log của các instance cluster vào một file nếu chạy nhiều instance
  }]
};
