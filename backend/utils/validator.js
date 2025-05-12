// utils/validator.js (Phiên bản hoàn chỉnh đã sửa đổi)
const { body, param, validationResult } = require('express-validator'); // Thêm 'param' nếu cần validate URL params

// Middleware xử lý lỗi validation tập trung (Giữ nguyên)
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req); // Lấy kết quả validation từ request
    if (!errors.isEmpty()) { // Nếu có lỗi
        // Log lỗi validation để dễ debug phía server (tùy chọn)
        // const logger = require('./logger'); // Import logger nếu muốn log
        // logger.warn('Validation Errors:', errors.array());
        // Chỉ trả về mảng lỗi cho client với status 400
        return res.status(400).json({ errors: errors.array() }); //
    }
    // Nếu không có lỗi, đi tiếp middleware/controller tiếp theo
    next(); //
};

// --- Validation Rules ---

// Rules cho đăng ký
const registerRules = () => [
    body('customer_name', 'Tên khách hàng là bắt buộc').notEmpty().trim().escape(), // Không rỗng, xóa khoảng trắng thừa, escape ký tự HTML
    body('username', 'Username không hợp lệ (nếu có)')
        .optional({ checkFalsy: true }) // Cho phép null hoặc chuỗi rỗng được bỏ qua
        .isString()
        .trim()
        .escape()
        .isLength({ min: 3 }).withMessage('Username phải có ít nhất 3 ký tự'), // Username giờ tùy chọn
    body('customer_email', 'Vui lòng nhập địa chỉ email hợp lệ').isEmail().normalizeEmail(), // Kiểm tra định dạng email, chuẩn hóa
    body('customer_password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 }), // Kiểm tra độ dài tối thiểu
    // SĐT giờ là bắt buộc và kiểm tra định dạng cơ bản (ví dụ cho VN)
    body('customer_tel', 'Số điện thoại là bắt buộc và phải hợp lệ')
        .notEmpty().withMessage('Số điện thoại không được để trống') // Không rỗng
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không đúng định dạng Việt Nam') // <<< Specify locale
        .trim().escape(),
    body('customer_address', 'Địa chỉ không hợp lệ').optional({ checkFalsy: true }).trim().escape(), // Địa chỉ tùy chọn
];

// Rules cho đăng nhập (chấp nhận email hoặc username)
const loginRules = () => [
    // Đổi thành kiểm tra 'identifier' thay vì 'customer_email'
    body('identifier', 'Vui lòng nhập Email hoặc Username').notEmpty().trim(), // Kiểm tra identifier không rỗng
    body('customer_password', 'Mật khẩu là bắt buộc').exists({ checkFalsy: true }), // checkFalsy để không chấp nhận chuỗi rỗng "" là hợp lệ
];

// <<< THÊM: Rules cho Admin Login >>>
const adminLoginRules = () => [
    body('username', 'Username là bắt buộc').notEmpty().trim(), // Admin login bằng username
    body('password', 'Mật khẩu là bắt buộc').exists({ checkFalsy: true }), // Tên field là 'password' theo controller
];

// <<< SỬA ĐỔI/TÁCH: Rules cho Tạo Product >>>
const productCreateRules = () => [
    body('product_name', 'Tên sản phẩm là bắt buộc').notEmpty().trim().escape(), //
    body('product_price', 'Giá sản phẩm phải là số dương').notEmpty().isFloat({ gt: 0 }), // Giá phải > 0
    body('product_stock', 'Số lượng tồn kho phải là số nguyên không âm').notEmpty().isInt({ min: 0 }), // Tồn kho >= 0
    body('imageUrl', 'URL hình ảnh không hợp lệ').optional({ checkFalsy: true }).isURL().trim(), // URL tùy chọn, nếu có phải hợp lệ
    body('categoryId', 'Loại sản phẩm (categoryId) là bắt buộc và phải là số nguyên dương').notEmpty().isInt({ gt: 0 }), // Category bắt buộc, ID > 0
    // Kiểm tra sizeIds là mảng không rỗng và các phần tử là số nguyên dương
    body('sizeIds', 'Size sản phẩm (sizeIds) là bắt buộc, phải là mảng chứa các ID hợp lệ và không được rỗng') //
        .isArray({ min: 1 }).withMessage('Phải chọn ít nhất một size') // Phải là mảng và có ít nhất 1 phần tử
        .custom((value) => value.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) // Check từng phần tử là số nguyên > 0
        .withMessage('Mỗi size ID phải là số nguyên dương hợp lệ'),
    // Thêm validation tương tự cho colorIds, collectionIds nếu chúng bắt buộc hoặc cần kiểm tra kiểu
    // body('colorIds', 'Color IDs must be an array of positive integers').optional().isArray().custom(...),
    // body('collectionIds', 'Collection IDs must be an array of positive integers').optional().isArray().custom(...),
    body('isNewArrival', 'Trạng thái hàng mới (isNewArrival) phải là true hoặc false').optional().isBoolean().toBoolean(), // Tùy chọn, chuyển thành boolean
    body('product_description', 'Mô tả không hợp lệ').optional({ checkFalsy: true }).trim().escape(), // Mô tả tùy chọn
];

// <<< SỬA ĐỔI/TÁCH: Rules cho Cập nhật Product >>>
const productUpdateRules = () => [
    // Các trường đều là optional khi cập nhật
    body('product_name', 'Tên sản phẩm không hợp lệ').optional().notEmpty().trim().escape(), // Optional nhưng nếu có thì không rỗng
    body('product_price', 'Giá sản phẩm phải là số dương').optional().isFloat({ gt: 0 }), //
    body('product_stock', 'Số lượng tồn kho phải là số nguyên không âm').optional().isInt({ min: 0 }), //
    body('imageUrl', 'URL hình ảnh không hợp lệ').optional({ checkFalsy: true }).isURL().trim(), //
    body('categoryId', 'Loại sản phẩm (categoryId) phải là số nguyên dương')
        .optional({ nullable: true }) // Cho phép gửi null để xóa category (nếu DB cho phép)
        .isInt({ gt: 0 }).withMessage('categoryId phải là số nguyên dương.'), // Chỉ validate nếu giá trị không phải null
    body('sizeIds', 'Size sản phẩm (sizeIds) phải là mảng chứa các ID hợp lệ')
        .optional() // Cho phép không gửi lên nếu không muốn cập nhật sizes
        .isArray().withMessage('sizeIds phải là một mảng.') // Nếu gửi lên thì phải là mảng
        .custom((value) => value.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) // Check từng phần tử nếu mảng tồn tại
        .withMessage('Mỗi size ID trong mảng phải là số nguyên dương hợp lệ.'),
    // Thêm validation tương tự cho colorIds, collectionIds
    body('isNewArrival', 'Trạng thái hàng mới (isNewArrival) phải là true hoặc false').optional().isBoolean().toBoolean(), //
    body('product_description', 'Mô tả không hợp lệ').optional({ checkFalsy: true }).trim().escape(), //
];

// <<< SỬA ĐỔI: Rules cho Tạo Sale >>>
const saleCreateRules = () => [
    // Không cần validate customer_id, sale_status nữa (lấy từ auth và set server-side)
    body('items', 'Đơn hàng phải có ít nhất một sản phẩm').isArray({ min: 1 }), // 'items' phải là mảng và có ít nhất 1 phần tử
    body('items.*.product_id', 'Mỗi sản phẩm trong đơn hàng phải có product_id hợp lệ').isInt({ gt: 0 }), // Kiểm tra product_id trong từng item
    body('items.*.product_qty', 'Số lượng mỗi sản phẩm phải là số nguyên lớn hơn 0').isInt({ gt: 0 }), // Kiểm tra product_qty trong từng item
];

// <<< THÊM: Rules cho cập nhật trạng thái Sale >>>
const saleStatusUpdateRules = () => [
    body('status', 'Trạng thái mới là bắt buộc và phải hợp lệ')
        .notEmpty().withMessage('Trạng thái không được để trống.') // Không rỗng
        .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed']) // Phải là một trong các giá trị này
        .withMessage('Trạng thái không hợp lệ.'),
    body('notes', 'Ghi chú không hợp lệ').optional({ checkFalsy: true }).trim().escape(), // Ghi chú tùy chọn
];

// <<< THÊM: Rules cho Quên mật khẩu >>>
const forgotPasswordRules = () => [
    body('email', 'Vui lòng nhập địa chỉ email hợp lệ').isEmail().normalizeEmail(), // Chỉ cần validate email
];

// <<< THÊM: Rules cho Reset mật khẩu >>>
const resetPasswordRules = () => [
    // Token được lấy từ URL param, không cần validate ở body
    body('password', 'Mật khẩu mới phải có ít nhất 6 ký tự').isLength({ min: 6 }), // Validate mật khẩu mới
    // Có thể thêm validation trùng khớp mật khẩu nếu form có ô nhập lại mật khẩu
    // body('confirmPassword').custom((value, { req }) => {
    //     if (value !== req.body.password) {
    //         throw new Error('Mật khẩu nhập lại không khớp.');
    //     }
    //     return true;
    // })
];

module.exports = {
    handleValidationErrors,
    registerRules,
    loginRules,
    adminLoginRules,        // <<< Export mới
    productCreateRules,     // <<< Export mới
    productUpdateRules,     // <<< Export mới
    saleCreateRules,        // <<< Export mới (tên cũ là saleRules)
    saleStatusUpdateRules,  // <<< Export mới
    forgotPasswordRules,    // <<< Export mới
    resetPasswordRules,     // <<< Export mới
}; //