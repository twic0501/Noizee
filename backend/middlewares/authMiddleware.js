// middlewares/authMiddleware.js (Phiên bản hoàn chỉnh đã sửa đổi)
const jwt = require('jsonwebtoken');
const { db } = require('../config/db'); // Điều chỉnh đường dẫn nếu cần
const Customer = db.Customer; // Lấy model Customer
const logger = require('../utils/logger'); // Import logger

/**
 * Middleware để bảo vệ các route yêu cầu đăng nhập.
 * Xác thực JWT từ header 'Authorization: Bearer <token>'.
 * Nếu token hợp lệ và user tồn tại, gắn thông tin user (trừ password) vào req.user.
 */
const protect = async (req, res, next) => {
    let token;

    // 1. Kiểm tra header Authorization và định dạng Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Lấy token từ header (bỏ chữ 'Bearer ')
            token = req.headers.authorization.split(' ')[1]; //

            // 3. Xác thực token bằng secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET); //

            // 4. Lấy thông tin user từ payload đã giải mã
            // --- SỬA ĐỔI QUAN TRỌNG: Truy cập payload theo cấu trúc đã tạo ---
            // Giả sử payload khi tạo token là { user: { id: ..., username: ..., isAdmin: ... } }
            if (!decoded.user || !decoded.user.id) {
                // Nếu payload không đúng cấu trúc mong đợi
                logger.warn(`Authentication failed: Invalid token payload structure.`); //
                return res.status(401).json({ message: 'Not authorized, invalid token payload' }); //
            }

            // 5. Lấy thông tin user mới nhất từ DB dựa vào ID trong token
            //    - Đảm bảo user còn tồn tại.
            //    - Lấy được thông tin cập nhật nhất (vd: quyền isAdmin có thể bị thay đổi).
            //    - Loại bỏ mật khẩu và các trường không cần thiết/nhạy cảm khác.
            req.user = await Customer.findByPk(decoded.user.id, {
                attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
            }); //

            // 6. Kiểm tra xem user lấy từ DB có thực sự tồn tại không
            if (!req.user) {
                logger.warn(`Authentication failed: User ID ${decoded.user.id} from valid token not found in DB.`); // User có thể đã bị xóa sau khi token được cấp
                return res.status(401).json({ message: 'Not authorized, user not found' }); //
            }

            // Ghi log (tùy chọn, có thể tắt ở production)
            // logger.info(`User authenticated via token: ${req.user.customer_email} (ID: ${req.user.customer_id}, Admin: ${req.user.isAdmin})`);
            // 7. Cho phép đi tiếp tới middleware/controller tiếp theo
            next(); //

        } catch (error) {
            // Xử lý lỗi xác thực token (sai secret, hết hạn,...)
            logger.error('JWT verification failed:', error.message); //
            let message = 'Not authorized, token failed';
            if (error.name === 'JsonWebTokenError') {
                message = 'Not authorized, token invalid'; // Token không hợp lệ
            } else if (error.name === 'TokenExpiredError') {
                message = 'Not authorized, token expired'; // Token hết hạn
            }
            // Luôn trả về 401 cho lỗi token
            return res.status(401).json({ message }); //
        }
    }

    // Nếu không có token trong header hoặc không đúng định dạng Bearer
    if (!token) {
        logger.warn('Authentication attempt failed: No token provided.'); //
        res.status(401).json({ message: 'Not authorized, no token provided' }); //
    }
};

/**
 * Middleware để kiểm tra quyền Admin.
 * Middleware này PHẢI được dùng SAU middleware 'protect'.
 */
const isAdmin = (req, res, next) => {
    // Kiểm tra xem req.user đã được gắn bởi 'protect' và có isAdmin = true không
    if (req.user && req.user.isAdmin === true) {
        next(); // Là admin, cho phép đi tiếp
    } else {
        logger.warn(`Authorization failed: User ID ${req.user?.id || 'N/A'} does not have admin privileges.`); //
        res.status(403).json({ message: 'Forbidden: Administrator privileges required.' }); // 403 Forbidden
    }
};

// --- Ví dụ về Role-based (nếu sau này mở rộng) ---
// const authorize = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.role) { // Giả sử có trường 'role' trong req.user
//       return res.status(403).json({ message: 'Forbidden: Role information missing.' });
//     }
//     if (!allowedRoles.includes(req.user.role)) {
//         logger.warn(`Authorization failed: Role [<span class="math-inline">\{req\.user\.role\}\] not in allowed roles \[</span>{allowedRoles.join(', ')}] for user ${req.user.id}`);
//         return res.status(403).json({ message: `Forbidden: Role [${req.user.role}] is not authorized.` });
//     }
//     next();
//   };
// };
// Cách dùng: router.get('/admin/resource', protect, authorize('admin', 'manager'), someController);

module.exports = {
    protect,
    isAdmin // <<< Export thêm middleware isAdmin
    // authorize // Export nếu dùng
}; //