// routes/authRoutes.js (Phiên bản hoàn chỉnh đã sửa đổi)
const express = require('express'); //
const {
    registerCustomer,
    loginCustomer,      // Login bằng email hoặc username
    getCustomerProfile,
    loginAdmin,         // <<< Controller mới: Login Admin bằng username
    forgotPassword,     // <<< Controller mới
    resetPassword       // <<< Controller mới
} = require('../controllers/authController'); //

// Import middleware bảo vệ và middleware kiểm tra Admin
const { protect, isAdmin } = require('../middlewares/authMiddleware'); //

// Import các quy tắc validation (cần cập nhật/thêm cho phù hợp)
const {
    registerRules,
    loginRules,           // Cần đảm bảo rules này chấp nhận 'identifier' hoặc tạo rules riêng
    adminLoginRules,      // <<< TẠO RULES NÀY nếu validation khác user
    forgotPasswordRules,  // <<< TẠO RULES NÀY (check email)
    resetPasswordRules,   // <<< TẠO RULES NÀY (check password mới)
    handleValidationErrors
} = require('../utils/validator'); // Giả sử validator đã được cập nhật

const router = express.Router(); //

// --- User Routes ---

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
router.post('/register', registerRules(), handleValidationErrors, registerCustomer); //

// @desc    Đăng nhập User (bằng email hoặc username)
// @route   POST /api/auth/login
router.post('/login', loginRules(), handleValidationErrors, loginCustomer); // Đảm bảo loginRules kiểm tra 'identifier'

// @desc    Lấy thông tin profile user hiện tại
// @route   GET /api/auth/profile
router.get('/profile', protect, getCustomerProfile); // Chỉ cần đăng nhập

// --- Admin Route ---

// @desc    Đăng nhập Admin (bằng username)
// @route   POST /api/auth/admin/login
router.post('/admin/login', adminLoginRules ? adminLoginRules() : loginRules(), handleValidationErrors, loginAdmin); // Dùng adminLoginRules nếu có

// --- Password Reset Routes ---

// @desc    Yêu cầu đặt lại mật khẩu (gửi token qua email)
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordRules(), handleValidationErrors, forgotPassword); //

// @desc    Đặt lại mật khẩu bằng token
// @route   PUT /api/auth/reset-password/:token  (Dùng PUT)
router.put('/reset-password/:token', resetPasswordRules(), handleValidationErrors, resetPassword); //

module.exports = router; //