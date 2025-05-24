// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');
// Không cần import db và ProductImage ở đây nữa nếu route này chỉ trả về URL
// Việc lưu vào DB sẽ do resolver của Product đảm nhiệm.

const router = express.Router();

// --- Cấu hình Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Đường dẫn tới thư mục public/uploads/products từ thư mục gốc của dự án
        // __dirname là thư mục hiện tại (routes), '..' đi lên backend, rồi vào public/uploads/products
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'products');
        try {
            // Đảm bảo thư mục tồn tại, nếu không thì tạo nó
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
                logger.info(`Upload directory created: ${uploadPath}`);
            }
            cb(null, uploadPath);
        } catch (error) {
            logger.error(`Failed to create or access upload directory: ${uploadPath}`, error);
            cb(new Error('Không thể tạo hoặc truy cập thư mục upload.')); // Lỗi rõ ràng hơn cho client
        }
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất để tránh ghi đè
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const finalFilename = file.fieldname + '-' + uniqueSuffix + extension;
        logger.debug(`Generated filename for upload: ${finalFilename}`);
        cb(null, finalFilename);
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        logger.warn(`Upload rejected: File type ${file.mimetype} is not an image.`);
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Chỉ được upload file hình ảnh!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB cho mỗi file
    }
});

// --- Route Upload Ảnh Sản Phẩm (Cho phép nhiều ảnh) ---
// POST /api/uploads/product-images
// Tên field trong form-data để gửi file ảnh là 'productImages'
router.post(
    '/product-images',
    protect, // Yêu cầu đăng nhập
    isAdmin,  // Yêu cầu quyền Admin
    upload.array('productImages', 10), // Middleware của Multer để xử lý mảng file, tối đa 10 files
    async (req, res, next) => {
        try {
            // req.files là một mảng các đối tượng file đã được upload bởi multer
            if (!req.files || req.files.length === 0) {
                // Điều này không nên xảy ra nếu Multer hoạt động đúng và có file được gửi
                // nhưng vẫn kiểm tra để đảm bảo
                logger.warn('Upload Warning: req.files is undefined or empty after multer processing, but no Multer error was caught.');
                return res.status(400).json({ success: false, message: 'Không có file ảnh nào được tải lên hoặc có lỗi trong quá trình xử lý file.' });
            }

            // Tạo mảng các URL cho các ảnh đã upload
            // Đường dẫn này sẽ được sử dụng ở frontend để hiển thị ảnh
            // và được gửi đến API tạo/cập nhật sản phẩm để lưu vào database.
            const uploadedImageDetails = req.files.map(file => {
                // Tạo đường dẫn tương đối có thể truy cập từ client
                // Ví dụ: /uploads/products/productImages-162987832478-3847384.jpg
                // Express đã được cấu hình trong app.js để phục vụ file tĩnh từ 'public'
                // nên '/uploads/...' sẽ trỏ đúng vào 'public/uploads/...'
                const relativePath = `/uploads/products/${file.filename}`;
                return {
                    url: relativePath, // URL để truy cập ảnh
                    originalName: file.originalname, // Tên file gốc
                    filename: file.filename // Tên file đã lưu trên server
                };
            });

            logger.info(`${uploadedImageDetails.length} product image(s) uploaded successfully by user ID ${req.user?.id}.`);
            res.status(201).json({
                success: true,
                message: 'Các hình ảnh đã được tải lên thành công.',
                images: uploadedImageDetails // Trả về mảng các đối tượng chứa thông tin ảnh
            });

        } catch (error) {
            // Bất kỳ lỗi nào không được Multer bắt (ví dụ lỗi logic sau khi upload)
            // sẽ được chuyển đến error handler chung.
            logger.error('Error in POST /api/uploads/product-images handler after Multer:', error);
            next(error);
        }
    }
);

// Middleware xử lý lỗi cụ thể cho route upload này (đặc biệt là lỗi từ Multer)
// Nó nên được đặt sau route upload.
router.use('/product-images', (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        logger.warn('MulterError caught in upload route:', { code: error.code, message: error.message, field: error.field });
        let message = `Lỗi upload: ${error.message}.`;
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'File ảnh quá lớn (tối đa 5MB).';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Chỉ được upload file hình ảnh!';
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            message = 'Số lượng file upload vượt quá giới hạn cho phép (tối đa 10 files).';
        }
        return res.status(400).json({ success: false, message });
    } else if (error) {
        // Các lỗi khác không phải từ Multer
        logger.error('Non-Multer error in upload route specific handler:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi không mong muốn trong quá trình upload.'
        });
    }
    // Nếu không có lỗi, chuyển tiếp (mặc dù ít khi xảy ra ở đây)
    next();
});


module.exports = router;
