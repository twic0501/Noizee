// config/env.js (Đã thêm kiểm tra JWT_SECRET)
require('dotenv').config();

// KIỂM TRA BIẾN MÔI TRƯỜNG QUAN TRỌNG KHI KHỞI ĐỘNG
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables."); // [cite: 22]
    process.exit(1); // Thoát ứng dụng nếu thiếu JWT_SECRET
}

// (Tùy chọn) Kiểm tra thêm các biến cần thiết khác như Google credentials nếu dùng OAuth
// if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//     console.error("FATAL ERROR: Google OAuth credentials are not defined.");
//     process.exit(1);
// }

module.exports = {
    port: process.env.PORT || 5000, // [cite: 23] Cổng mặc định là 5000
    db: { // Cấu hình DB lấy từ biến môi trường [cite: 23]
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306, // [cite: 24] Cổng MySQL/MariaDB mặc định
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dialect: process.env.DB_DIALECT || 'mysql', // [cite: 24]
    },
    jwt: { // Cấu hình JWT [cite: 24]
        secret: process.env.JWT_SECRET, // Đã kiểm tra ở trên
        expiresIn: process.env.JWT_EXPIRES_IN || '1h', // [cite: 25] Thời gian hết hạn token, mặc định 1 giờ
    },
    nodeEnv: process.env.NODE_ENV || 'development', // [cite: 25] Môi trường chạy (development/production)
    google: { // Cấu hình Google OAuth [cite: 25]
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:5173' // [cite: 26] Thêm frontend URL vào config
};