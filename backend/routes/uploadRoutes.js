// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');
const { db } = require('../config/db'); // Import db để dùng model ProductImage
const ProductImage = db.ProductImage; // Lấy model ProductImage

const router = express.Router();

// --- Cấu hình Multer (Tương tự như trước) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'products');
        try {
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            logger.error(`Failed to create upload directory: ${uploadPath}`, error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Chỉ được upload file hình ảnh!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- Route Upload Mới (Xử lý nhiều ảnh) ---
// POST /api/uploads/product-images
// Request body có thể chứa:
// - product_id (ID của sản phẩm đã tồn tại - nếu upload ảnh cho sản phẩm đã có)
// - color_id (ID của màu - nếu ảnh này cho màu cụ thể, tùy chọn)
// - display_order_start (Thứ tự bắt đầu cho các ảnh, ví dụ 0, tùy chọn)
// Field chứa file ảnh sẽ là 'productImages' (mảng)
router.post(
    '/product-images',
    protect, // Yêu cầu đăng nhập
    isAdmin,  // Yêu cầu quyền Admin

    // Sử dụng upload.array() để nhận nhiều file
    // 'productImages' là tên field trong form-data, 10 là số lượng file tối đa
    upload.array('productImages', 10),

    async (req, res, next) => {
        try {
            // req.files là một mảng các đối tượng file đã được upload bởi multer
            if (!req.files || req.files.length === 0) {
                logger.warn('Upload Warning: req.files is undefined or empty after multer processing.');
                return res.status(400).json({ message: 'Không có file ảnh nào được tải lên.' });
            }

            // Lấy product_id, color_id, display_order_start từ req.body nếu có
            // Quan trọng: product_id có thể chưa có nếu đây là quá trình tạo sản phẩm mới hoàn toàn.
            // Trong trường hợp đó, frontend sẽ upload ảnh, nhận lại URLs, rồi gửi URLs này cùng
            // với các thông tin sản phẩm khác khi tạo sản phẩm.
            // Hoặc, frontend gửi product_id của sản phẩm ĐÃ TẠO để thêm ảnh.
            // Cách tiếp cận đơn giản hơn hiện tại là: API này chỉ trả về URLs, việc tạo record ProductImage
            // sẽ do API createProduct/updateProduct đảm nhiệm sau khi nhận URLs.

            const uploadedImageUrls = req.files.map(file => {
                const relativePath = `/uploads/products/${file.filename}`;
                return {
                    url: relativePath,
                    originalName: file.originalname,
                    // Bạn có thể trả về thêm thông tin nếu cần
                };
            });

            logger.info(`${uploadedImageUrls.length} product images uploaded successfully.`);
            res.status(201).json({
                success: true,
                message: 'Các hình ảnh đã được tải lên thành công.',
                imageUrls: uploadedImageUrls // Trả về mảng các URL và thông tin ảnh
            });

        } catch (error) {
            logger.error('Error in product images upload handler:', error);
            next(error); // Chuyển lỗi đến error handler chung
        }
    }
);


// --- Route Upload Ảnh Đơn (Giữ lại nếu vẫn cần) ---
// POST /api/uploads/image (Route cũ của bạn)
// Route này có thể được giữ lại nếu bạn có nhu cầu upload một ảnh đơn cho mục đích khác,
// hoặc bạn có thể điều chỉnh nó.
// Hiện tại, tôi sẽ comment lại để tập trung vào upload nhiều ảnh.
/*
router.post(
    '/image',
    (req, res, next) => {
        logger.info('--- Received POST /api/uploads/image request ---');
        next();
    },
    protect,
    isAdmin,
    (req, res, next) => {
        logger.info(`User authenticated for upload: ${req.user?.customer_id || 'ID not found'}`);
        upload.single('productImage')(req, res, (err) => {
            if (err) {
                logger.error('Error during multer processing:', err);
                return next(err);
            }
            if (!req.file) {
                logger.warn('Upload Warning: req.file is undefined after multer processing.');
                return next(new Error('Không có file ảnh nào được tải lên hoặc file không hợp lệ.'));
            }
            logger.info(`File received: ${req.file.filename}, Size: ${req.file.size}`);
            next();
        });
    },
    (req, res, next) => {
        try {
            const imageUrl = `/uploads/products/${req.file.filename}`;
            logger.info(`Generated imageUrl: ${imageUrl}`);
            const responseData = {
                success: true,
                message: 'Hình ảnh đã được tải lên thành công',
                imageUrl: imageUrl
            };
            logger.info('--- Sending Success JSON Response ---:', responseData);
            res.status(201).json(responseData);
        } catch (error) {
            logger.error('Error in main upload controller:', error);
            next(error);
        }
    }
);

router.use('/image', (error, req, res, next) => {
    // ... (error handler cũ của bạn cho /image) ...
    logger.error("--- Upload Route Error Handler for /image ---");
    logger.error("Error Object:", error);

    let statusCode = 500;
    let message = 'Internal server error during upload.';

    if (error instanceof multer.MulterError) {
        statusCode = 400;
        message = `Upload error: ${error.message}`;
        if (error.code === 'LIMIT_FILE_SIZE') message = 'File ảnh quá lớn (tối đa 5MB).';
        if (error.code === 'LIMIT_UNEXPECTED_FILE' && error.message.includes('hình ảnh')) message = 'Chỉ được upload file hình ảnh!';
    } else if (error.message.includes('Chỉ được upload file hình ảnh') || error.message.includes('Không có file ảnh nào')) {
        statusCode = 400;
        message = error.message;
    }
    logger.error(`Responding with status ${statusCode}: ${message}`);
    res.status(statusCode).json({ success: false, message: message });
});
*/

// Error handler chung cho các lỗi khác của /api/uploads (nếu cần)
// Ví dụ, nếu bạn thêm các route upload khác
router.use((error, req, res, next) => {
    logger.error("--- General Upload Routes Error Handler ---");
    logger.error("Error Object:", error);

    let statusCode = error.status || 500;
    let message = error.message || 'An unexpected error occurred during the upload process.';

    // Xử lý lỗi cụ thể từ Multer nếu chưa được xử lý bởi handler con
    if (error instanceof multer.MulterError) {
        statusCode = 400;
        message = `Upload error: ${error.message}`;
        if (error.code === 'LIMIT_FILE_SIZE') message = 'File ảnh quá lớn (tối đa 5MB).';
        // Thêm các case khác của MulterError nếu cần
    }

    logger.error(`Responding with status ${statusCode}: ${message}`);
    res.status(statusCode).json({ success: false, message: message });
});


module.exports = router;