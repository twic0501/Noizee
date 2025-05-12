// config/passport-setup.js (Phiên bản cuối)
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('./db'); // [cite: 27] Import db object từ config/db.js
const Customer = db.Customer; // Lấy model Customer từ db object
const logger = require('../utils/logger'); // [cite: 27] Import logger

// Kiểm tra biến môi trường Google OAuth (thêm kiểm tra nếu cần)
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    logger.error("FATAL ERROR: Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) are not fully defined.");
    // Có thể process.exit(1) ở đây nếu Google Auth là bắt buộc
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL, // URL mà Google sẽ gọi lại sau khi user xác thực
            scope: ['profile', 'email'] // Yêu cầu quyền truy cập profile và email cơ bản [cite: 28]
        },
        // Hàm callback này sẽ được gọi sau khi Google xác thực user thành công
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id; // [cite: 28] ID duy nhất của user trên Google
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null; // Lấy email chính
                const name = profile.displayName || 'Google User'; // Tên hiển thị

                // --- Logic xử lý user ---
                // 1. Kiểm tra xem email có được trả về không
                if (!email) {
                    logger.error('Google OAuth Error: Could not retrieve email from Google profile.');
                    return done(new Error('Could not retrieve email from Google.'), null); // [cite: 29] Gọi done với lỗi
                }

                // 2. Tìm user bằng googleId trước
                let customer = await Customer.findOne({ where: { googleId: googleId } });
                if (customer) {
                    logger.info(`Google OAuth: Found existing user by googleId: ${email}`); // [cite: 29]
                    return done(null, customer); // User đã tồn tại và liên kết Google, trả về user
                }

                // 3. Nếu không tìm thấy bằng googleId, tìm bằng email
                customer = await Customer.findOne({ where: { customer_email: email } }); // [cite: 29]
                if (customer) {
                    // User đã có tài khoản bằng email này nhưng chưa liên kết Google
                    logger.info(`Google OAuth: Found user by email, linking googleId: ${email}`); // [cite: 30]
                    customer.googleId = googleId; // Liên kết googleId
                    // (Tùy chọn) Cập nhật tên nếu tên trên Google khác
                    // customer.customer_name = name;
                    await customer.save(); // Lưu thay đổi

                    // Đánh dấu tạm thời để client biết user này cần hoàn tất thông tin nếu cần
                    customer.needsCompletion = true; // [cite: 30, 31]
                    return done(null, customer); // Trả về user đã liên kết
                }

                // 4. Nếu không tìm thấy cả googleId và email => User mới hoàn toàn qua Google
                logger.info(`Google OAuth: New user detected, requires completion: ${email}`); // [cite: 32]
                // Tạo một đối tượng tạm chứa thông tin profile mới
                const newUserProfile = {
                    googleId: googleId,
                    email: email,
                    name: name
                    // Có thể thêm avatar từ profile.photos[0].value nếu cần
                }; // [cite: 33]

                // Quan trọng: KHÔNG tạo user mới ngay lập tức ở đây.
                // Thay vào đó, trả về `false` cho user và thông tin profile mới trong đối số thứ 3 (info)
                // để client có thể điều hướng user đến trang hoàn tất đăng ký.
                return done(null, false, { newUserProfile: newUserProfile }); // [cite: 33, 34]

            } catch (error) {
                logger.error('Error in Google OAuth strategy verify callback:', error); // [cite: 34]
                return done(error, null); // [cite: 35] Gọi done với lỗi hệ thống
            }
        }
    )
);

// --- Không cần serialize/deserialize nếu dùng JWT ---
// Nếu bạn dùng session-based auth với passport thì cần các hàm này:
// passport.serializeUser((user, done) => {
//     done(null, user.customer_id); // Chỉ lưu ID vào session
// });
// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await Customer.findByPk(id);
//         done(null, user); // Gắn user object đầy đủ vào req.user
//     } catch (error) {
//         done(error, null);
//     }
// });