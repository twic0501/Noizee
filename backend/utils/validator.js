// backend/utils/validator.js
const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- AUTH VALIDATION RULES ---
const registerRules = () => [
    body('customer_name', 'Tên khách hàng là bắt buộc').notEmpty().trim().escape(),
    body('username', 'Username không hợp lệ (nếu có)')
        .optional({ checkFalsy: true })
        .isString().trim().escape()
        .isLength({ min: 3 }).withMessage('Username phải có ít nhất 3 ký tự'),
    body('customer_email', 'Vui lòng nhập địa chỉ email hợp lệ').isEmail().normalizeEmail(),
    body('customer_password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 }),
    body('customer_tel', 'Số điện thoại là bắt buộc và phải hợp lệ')
        .notEmpty().withMessage('Số điện thoại không được để trống')
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không đúng định dạng Việt Nam')
        .trim().escape(),
    body('customer_address', 'Địa chỉ không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];

const loginRules = () => [
    body('identifier', 'Vui lòng nhập Email hoặc Username').notEmpty().trim(),
    body('customer_password', 'Mật khẩu là bắt buộc').exists({ checkFalsy: true }),
];

const adminLoginRules = () => [
    body('username', 'Username là bắt buộc').notEmpty().trim(),
    body('password', 'Mật khẩu là bắt buộc').exists({ checkFalsy: true }),
];

const forgotPasswordRules = () => [
    body('email', 'Vui lòng nhập địa chỉ email hợp lệ').isEmail().normalizeEmail(),
];

const resetPasswordRules = () => [
    body('password', 'Mật khẩu mới phải có ít nhất 6 ký tự').isLength({ min: 6 }),
];

// --- PRODUCT VALIDATION RULES ---
const productCreateRules = () => [
    body('product_name_vi', 'Tên sản phẩm (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('product_name_en', 'Tên sản phẩm (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_description_vi', 'Mô tả (Tiếng Việt) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_description_en', 'Mô tả (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_price', 'Giá sản phẩm phải là số dương').notEmpty().isFloat({ gt: 0 }),
    body('category_id', 'Loại sản phẩm (category_id) phải là số nguyên dương')
        .optional({ nullable: true }) // Cho phép null nếu sản phẩm không thuộc category nào
        .isInt({ gt: 0 }),
    body('is_new_arrival', 'Trạng thái hàng mới phải là boolean').optional().isBoolean().toBoolean(),
    body('is_active', 'Trạng thái active phải là boolean').optional().isBoolean().toBoolean(),
    body('collection_ids', 'Collection IDs phải là một mảng các số nguyên dương (nếu có)')
        .optional()
        .isArray().withMessage('collection_ids phải là một mảng.')
        .custom((value) => !value || value.every(id => Number.isInteger(Number(id)) && Number(id) > 0))
        .withMessage('Mỗi collection_id phải là số nguyên dương.'),

    // Validation cho color_variants_data
    body('color_variants_data', 'Phải có ít nhất một biến thể màu').isArray({ min: 1 }).withMessage('color_variants_data phải là mảng và có ít nhất 1 phần tử.'),
    body('color_variants_data.*.color_id', 'Mỗi biến thể màu phải có color_id hợp lệ').isInt({ gt: 0 }),
    body('color_variants_data.*.variant_specific_images', 'Ảnh riêng cho biến thể màu phải là một mảng').isArray(),
    body('color_variants_data.*.variant_specific_images.*.image_url', 'Mỗi ảnh biến thể phải có image_url hợp lệ').isURL(), // Đảm bảo là URL hợp lệ
    body('color_variants_data.*.variant_specific_images.*.display_order', 'Mỗi ảnh biến thể phải có display_order là số nguyên').isInt({ min: 0 }),
    body('color_variants_data.*.variant_specific_images.*.alt_text_vi', 'Alt text (VI) của ảnh biến thể không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('color_variants_data.*.variant_specific_images.*.alt_text_en', 'Alt text (EN) của ảnh biến thể không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('color_variants_data.*.inventory_entries', 'Mỗi biến thể màu phải có ít nhất một mục tồn kho').isArray({ min: 1 }).withMessage('inventory_entries phải là mảng và có ít nhất 1 phần tử.'),
    body('color_variants_data.*.inventory_entries.*.quantity', 'Số lượng tồn kho của mỗi mục phải là số nguyên không âm').isInt({ min: 0 }),
    body('color_variants_data.*.inventory_entries.*.size_id', 'size_id của mục tồn kho (nếu có) phải là số nguyên dương')
        .optional({ nullable: true })
        .isInt({ gt: 0 }),
    body('color_variants_data.*.inventory_entries.*.sku', 'SKU của mục tồn kho không hợp lệ').optional({ checkFalsy: true }).trim().escape(),

    // Validation cho general_gallery_images
    body('general_gallery_images', 'Ảnh chung cho sản phẩm phải là một mảng (nếu có)').optional().isArray(),
    body('general_gallery_images.*.image_url', 'Mỗi ảnh chung phải có image_url hợp lệ').if(body('general_gallery_images').exists({checkNull: true, checkFalsy: false})).isURL(), // Chỉ validate nếu mảng tồn tại và không null
    body('general_gallery_images.*.display_order', 'Mỗi ảnh chung phải có display_order là số nguyên').if(body('general_gallery_images').exists({checkNull: true, checkFalsy: false})).isInt({ min: 0 }),
    body('general_gallery_images.*.alt_text_vi', 'Alt text (VI) của ảnh chung không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('general_gallery_images.*.alt_text_en', 'Alt text (EN) của ảnh chung không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];

const productUpdateRules = () => [
    param('id', 'Product ID không hợp lệ').isInt({ gt: 0 }),
    body('product_name_vi', 'Tên sản phẩm (Tiếng Việt) không hợp lệ').optional().notEmpty().trim().escape(),
    body('product_name_en', 'Tên sản phẩm (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_description_vi', 'Mô tả (Tiếng Việt) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_description_en', 'Mô tả (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('product_price', 'Giá sản phẩm phải là số dương').optional().isFloat({ gt: 0 }),
    body('category_id', 'Loại sản phẩm (category_id) phải là số nguyên dương')
        .optional({ nullable: true })
        .isInt({ gt: 0 }),
    body('is_new_arrival', 'Trạng thái hàng mới phải là boolean').optional().isBoolean().toBoolean(),
    body('is_active', 'Trạng thái active phải là boolean').optional().isBoolean().toBoolean(),
    body('collection_ids', 'Collection IDs phải là một mảng các số nguyên dương (nếu có)')
        .optional()
        .isArray().withMessage('collection_ids phải là một mảng.')
        .custom((value) => !value || value.every(id => Number.isInteger(Number(id)) && Number(id) > 0))
        .withMessage('Mỗi collection_id phải là số nguyên dương.'),

    body('color_variants_data', 'color_variants_data phải là một mảng (nếu được cung cấp)')
        .optional()
        .isArray().withMessage('color_variants_data phải là mảng.')
        .custom((value) => {
            if (Array.isArray(value)) { // Chỉ validate nếu là mảng (dù rỗng)
                 if (value.length === 0) return true; // Cho phép gửi mảng rỗng để xóa hết
                return value.every(variant =>
                    variant.color_id && Number.isInteger(Number(variant.color_id)) && Number(variant.color_id) > 0 &&
                    Array.isArray(variant.variant_specific_images) &&
                    Array.isArray(variant.inventory_entries) && variant.inventory_entries.length > 0 &&
                    variant.variant_specific_images.every(img => typeof img.image_url === 'string' && img.image_url.trim() !== '' && typeof img.display_order === 'number') &&
                    variant.inventory_entries.every(inv => typeof inv.quantity === 'number' && inv.quantity >= 0)
                );
            }
            return true;
        }).withMessage('Mỗi biến thể màu trong color_variants_data (nếu có) phải hợp lệ và có ít nhất một mục tồn kho.'),

    body('general_gallery_images', 'Ảnh chung cho sản phẩm phải là một mảng (nếu được cung cấp)')
        .optional()
        .isArray().withMessage('general_gallery_images phải là mảng.')
        .custom((value) => {
            if (Array.isArray(value)) {
                 if (value.length === 0) return true; // Cho phép gửi mảng rỗng để xóa hết
                return value.every(img => typeof img.image_url === 'string' && img.image_url.trim() !== '' && typeof img.display_order === 'number');
            }
            return true;
        }).withMessage('Mỗi ảnh chung trong general_gallery_images (nếu có) phải có image_url và display_order.'),
];


// --- SALE VALIDATION RULES ---
const saleCreateRules = () => [
    body('items', 'Đơn hàng phải có ít nhất một sản phẩm').isArray({ min: 1 }),
    body('items.*.product_id', 'Mỗi sản phẩm trong đơn hàng phải có product_id hợp lệ').isInt({ gt: 0 }),
    body('items.*.product_qty', 'Số lượng mỗi sản phẩm phải là số nguyên lớn hơn 0').isInt({ gt: 0 }),
    body('items.*.size_id', 'size_id của sản phẩm (nếu có) phải là số nguyên dương').optional({nullable: true}).isInt({ gt: 0 }),
    body('items.*.color_id', 'color_id của sản phẩm (nếu có) phải là số nguyên dương').optional({nullable: true}).isInt({ gt: 0 }),
    body('shippingInfo.name', 'Tên người nhận không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('shippingInfo.phone', 'Số điện thoại người nhận không hợp lệ').optional({checkFalsy: true}).isMobilePhone('vi-VN').trim().escape(),
    body('shippingInfo.address', 'Địa chỉ người nhận không hợp lệ').optional({checkFalsy: true}).trim().escape(),
];

const saleStatusUpdateRules = () => [
    param('id', 'Sale ID không hợp lệ').isInt({ gt: 0 }),
    body('status', 'Trạng thái mới là bắt buộc và phải hợp lệ')
        .notEmpty().withMessage('Trạng thái không được để trống.')
        .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'])
        .withMessage('Trạng thái không hợp lệ.'),
    body('notes', 'Ghi chú không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];

// --- CATEGORY VALIDATION RULES ---
const categoryCreateRules = () => [
    body('category_name_vi', 'Tên loại sản phẩm (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('category_name_en', 'Tên loại sản phẩm (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];
const categoryUpdateRules = () => [
    param('id', 'Category ID không hợp lệ').isInt({ gt: 0 }),
    body('category_name_vi', 'Tên loại sản phẩm (Tiếng Việt) không được để trống nếu cung cấp').optional().notEmpty().trim().escape(),
    body('category_name_en', 'Tên loại sản phẩm (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];

// --- COLLECTION VALIDATION RULES ---
const collectionCreateRules = () => [
    body('collection_name_vi', 'Tên bộ sưu tập (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('collection_name_en', 'Tên bộ sưu tập (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('slug', 'Slug là bắt buộc').notEmpty().trim().isSlug(),
    body('collection_description_vi', 'Mô tả (Tiếng Việt) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('collection_description_en', 'Mô tả (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];
const collectionUpdateRules = () => [
    param('id', 'Collection ID không hợp lệ').isInt({ gt: 0 }),
    body('collection_name_vi', 'Tên bộ sưu tập (Tiếng Việt) không được để trống nếu cung cấp').optional().notEmpty().trim().escape(),
    body('collection_name_en', 'Tên bộ sưu tập (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('slug', 'Slug không được để trống nếu cung cấp').optional().notEmpty().trim().isSlug(),
    body('collection_description_vi', 'Mô tả (Tiếng Việt) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('collection_description_en', 'Mô tả (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
];

// --- COLOR & SIZE VALIDATION RULES ---
const colorCreateRules = () => [ // Rule riêng cho tạo Color (nếu có trường đa ngôn ngữ)
    body('color_name_vi', 'Tên màu (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('color_name_en', 'Tên màu (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('color_hex', 'Mã màu HEX không hợp lệ (ví dụ: #FF0000)')
        .optional({ checkFalsy: true })
        .isHexColor(),
];
const colorUpdateRules = () => [ // Rule riêng cho cập nhật Color
    param('id', 'Color ID không hợp lệ').isInt({ gt: 0 }),
    body('color_name_vi', 'Tên màu (Tiếng Việt) không được để trống nếu cung cấp').optional().notEmpty().trim().escape(),
    body('color_name_en', 'Tên màu (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('color_hex', 'Mã màu HEX không hợp lệ (ví dụ: #FF0000)')
        .optional({ checkFalsy: true })
        .isHexColor(),
];

const sizeRules = () => [ // Dùng cho cả create và update
    body('size_name', 'Tên kích thước là bắt buộc').notEmpty().trim().escape(),
];


// --- BLOG VALIDATION RULES ---
const blogPostCreateRules = () => [
    body('title_vi', 'Tiêu đề (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('title_en', 'Tiêu đề (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('content_html_vi', 'Nội dung (Tiếng Việt) là bắt buộc').notEmpty(),
    body('content_html_en', 'Nội dung (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }),
    body('slug', 'Slug không hợp lệ').optional({ checkFalsy: true }).trim().isSlug(),
    body('status', 'Trạng thái không hợp lệ').optional().isIn(['draft', 'published', 'archived']),
    body('visibility', 'Visibility không hợp lệ').optional().isIn(['public', 'private', 'members_only']),
    body('tag_ids', 'Tag IDs phải là một mảng các số nguyên dương (nếu có)')
        .optional()
        .isArray().withMessage('tag_ids phải là một mảng.')
        .custom((value) => !value || value.every(id => Number.isInteger(Number(id)) && Number(id) > 0))
        .withMessage('Mỗi tag_id phải là số nguyên dương.'),
    body('featured_image_url', 'URL ảnh đại diện không hợp lệ').optional({checkFalsy: true}).isURL(),
    body('excerpt_vi', 'Tóm tắt (Tiếng Việt) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('excerpt_en', 'Tóm tắt (Tiếng Anh) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_title_vi', 'Meta Title (VI) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_title_en', 'Meta Title (EN) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_description_vi', 'Meta Description (VI) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_description_en', 'Meta Description (EN) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
];

const blogPostUpdateRules = () => [
    param('id', 'Blog Post ID không hợp lệ').isInt({ gt: 0 }),
    body('title_vi', 'Tiêu đề (Tiếng Việt) không hợp lệ').optional().notEmpty().trim().escape(),
    body('title_en', 'Tiêu đề (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('content_html_vi', 'Nội dung (Tiếng Việt) không hợp lệ').optional().notEmpty(),
    body('content_html_en', 'Nội dung (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }),
    body('slug', 'Slug không hợp lệ').optional({ checkFalsy: true }).trim().isSlug(),
    body('status', 'Trạng thái không hợp lệ').optional().isIn(['draft', 'published', 'archived']),
    body('visibility', 'Visibility không hợp lệ').optional().isIn(['public', 'private', 'members_only']),
    body('tag_ids', 'Tag IDs phải là một mảng các số nguyên dương (nếu có)')
        .optional()
        .isArray().withMessage('tag_ids phải là một mảng.')
        .custom((value) => !value || value.every(id => Number.isInteger(Number(id)) && Number(id) > 0))
        .withMessage('Mỗi tag_id phải là số nguyên dương.'),
    body('featured_image_url', 'URL ảnh đại diện không hợp lệ').optional({checkFalsy: true}).isURL(),
    body('excerpt_vi', 'Tóm tắt (Tiếng Việt) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('excerpt_en', 'Tóm tắt (Tiếng Anh) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_title_vi', 'Meta Title (VI) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_title_en', 'Meta Title (EN) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_description_vi', 'Meta Description (VI) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
    body('meta_description_en', 'Meta Description (EN) không hợp lệ').optional({checkFalsy: true}).trim().escape(),
];

const blogTagCreateRules = () => [ // Đổi tên từ blogTagRules để phân biệt
    body('name_vi', 'Tên thẻ (Tiếng Việt) là bắt buộc').notEmpty().trim().escape(),
    body('name_en', 'Tên thẻ (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('slug', 'Slug không hợp lệ').optional({ checkFalsy: true }).trim().isSlug(),
];

const blogTagUpdateRules = () => [ // Rule riêng cho update tag
    param('id', 'Tag ID không hợp lệ').isInt({ gt: 0 }),
    body('name_vi', 'Tên thẻ (Tiếng Việt) không được để trống nếu cung cấp').optional().notEmpty().trim().escape(),
    body('name_en', 'Tên thẻ (Tiếng Anh) không hợp lệ').optional({ checkFalsy: true }).trim().escape(),
    body('slug', 'Slug không được để trống nếu cung cấp').optional().notEmpty().trim().isSlug(),
];

const blogCommentCreateRules = () => [
    body('post_id', 'Post ID là bắt buộc').isInt({ gt: 0 }),
    body('content', 'Nội dung bình luận là bắt buộc').notEmpty().trim().escape(),
    body('parent_comment_id', 'Parent Comment ID không hợp lệ').optional({nullable: true}).isInt({ gt: 0 }),
];


module.exports = {
    handleValidationErrors,
    registerRules,
    loginRules,
    adminLoginRules,
    forgotPasswordRules,
    resetPasswordRules,
    productCreateRules,
    productUpdateRules,
    saleCreateRules,
    saleStatusUpdateRules,
    categoryCreateRules,
    categoryUpdateRules,
    collectionCreateRules,
    collectionUpdateRules,
    colorCreateRules, // Thêm rule mới
    colorUpdateRules, // Thêm rule mới
    sizeRules, // Giữ nguyên nếu size không có đa ngôn ngữ
    blogPostCreateRules,
    blogPostUpdateRules,
    blogTagCreateRules, // Đổi tên
    blogTagUpdateRules, // Thêm rule mới
    blogCommentCreateRules,
};
