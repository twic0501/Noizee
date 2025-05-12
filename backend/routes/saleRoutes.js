// routes/saleRoutes.js (Phiên bản hoàn chỉnh đã sửa đổi)
const express = require('express'); //
const {
    createSale,
    getSaleById,
    getMySales,
    updateSaleStatus,
    getAllSales // <<< Import controller mới cho admin
} = require('../controllers/saleController'); //

// Import middleware bảo vệ VÀ middleware kiểm tra Admin
const { protect, isAdmin } = require('../middlewares/authMiddleware'); //

// Import validation (có thể thêm rules cho status update)
const {
    saleCreateRules, // Rules cho việc tạo đơn hàng
    saleStatusUpdateRules, // Rules cho việc cập nhật trạng thái (nếu cần)
    handleValidationErrors
} = require('../utils/validator'); //

const router = express.Router(); //

// Áp dụng middleware 'protect' cho TẤT CẢ các route trong file này
// Nghĩa là mọi request đến /api/sales/... đều phải được xác thực trước
router.use(protect); //

// --- User Routes (Đã qua 'protect') ---

// @desc    Tạo đơn hàng mới
// @route   POST /api/sales
router.post('/', saleCreateRules(), handleValidationErrors, createSale); //

// @desc    Lấy các đơn hàng của user đang đăng nhập
// @route   GET /api/sales/my
router.get('/my', getMySales); //

// @desc    Lấy chi tiết một đơn hàng (User chỉ xem được đơn của mình, controller đã xử lý quyền)
// @route   GET /api/sales/:id
router.get('/:id', getSaleById); //

// --- Admin Routes (Đã qua 'protect', cần thêm 'isAdmin') ---

// @desc    Admin cập nhật trạng thái đơn hàng
// @route   PUT /api/sales/:id/status
router.put(
    '/:id/status',
    isAdmin, // <<< Thêm kiểm tra Admin
    saleStatusUpdateRules ? saleStatusUpdateRules() : [], // Validate input status nếu cần
    handleValidationErrors,
    updateSaleStatus
); //

// @desc    Admin lấy TẤT CẢ đơn hàng (có filter, pagination)
// @route   GET /api/sales/admin/all (Hoặc chỉ GET /api/sales/ nếu phân quyền trong controller)
// Chọn một đường dẫn hợp lý, ví dụ /api/sales/admin/all
router.get(
    '/admin/all', // <<< Route mới cho admin
    isAdmin,      // <<< Chỉ Admin được truy cập
    getAllSales   // <<< Controller lấy tất cả sales
); //
// Lưu ý: Nếu dùng GET /api/sales/, bạn cần logic phức tạp hơn trong controller để phân biệt admin và user thường

module.exports = router; //