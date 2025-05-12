// routes/productRoutes.js (Phiên bản hoàn chỉnh đã sửa đổi)
const express = require('express'); //
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController'); //

// Import middleware bảo vệ VÀ middleware kiểm tra Admin
const { protect, isAdmin } = require('../middlewares/authMiddleware'); //

// Import validation (cần cập nhật để khớp với các trường mới của product)
const {
    productCreateRules, // Tạo rules riêng cho create
    productUpdateRules, // Tạo rules riêng cho update (thường là optional)
    handleValidationErrors
} = require('../utils/validator'); // Chia thành create/update rules nếu cần

const router = express.Router(); //

// --- Public Routes ---

// @desc    Lấy tất cả sản phẩm (có filter, pagination)
// @route   GET /api/products
router.get('/', getProducts); //

// @desc    Lấy chi tiết một sản phẩm
// @route   GET /api/products/:id
router.get('/:id', getProductById); //

// --- Admin Routes (Yêu cầu đăng nhập VÀ là Admin) ---

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
router.post(
    '/',
    protect,              // 1. Phải đăng nhập
    isAdmin,              // 2. Phải là Admin
    productCreateRules ? productCreateRules() : [], // 3. Validate input (cần cập nhật rules)
    handleValidationErrors,
    createProduct         // 4. Controller tạo sản phẩm
); //

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
router.put(
    '/:id',
    protect,              // 1. Phải đăng nhập
    isAdmin,              // 2. Phải là Admin
    productUpdateRules ? productUpdateRules() : [], // 3. Validate input (có thể khác create)
    handleValidationErrors,
    updateProduct         // 4. Controller cập nhật sản phẩm
); //

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
router.delete(
    '/:id',
    protect,              // 1. Phải đăng nhập
    isAdmin,              // 2. Phải là Admin
    deleteProduct         // 3. Controller xóa sản phẩm (thường không cần validation body)
); //

module.exports = router; //