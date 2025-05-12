// backend/routes/uploadRoutes.js (Phiên bản đề xuất - Tăng cường Logging)
const express = require('express');
const multer = require('multer'); // Import multer
const path = require('path');   // Import path để xử lý đường dẫn file
const fs = require('fs');       // Import fs để tạo thư mục
const { protect, isAdmin } = require('../middlewares/authMiddleware'); // Đảm bảo import đúng middleware xác thực và admin
const logger = require('../utils/logger'); // Sử dụng logger
const router = express.Router(); //

// --- Cấu hình Multer ---

// Cấu hình nơi lưu trữ file và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Đường dẫn tới thư mục lưu ảnh sản phẩm
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'products');
        try {
            // Tạo thư mục nếu chưa tồn tại (recursive: true để tạo cả thư mục cha nếu cần)
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath); // Gọi callback với đường dẫn lưu file
        } catch (error) {
            logger.error(`Failed to create upload directory: ${uploadPath}`, error); // Log lỗi
            cb(error); // Truyền lỗi cho middleware xử lý lỗi của multer/express
        }
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Tên file = fieldname-timestamp-random + phần mở rộng gốc
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); //
    }
});

// Cấu hình bộ lọc file (chỉ chấp nhận file ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { // Kiểm tra mimetype có phải là ảnh không
        cb(null, true); // Chấp nhận file
    } else {
        // Từ chối file và tạo lỗi rõ ràng hơn
         cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Chỉ được upload file hình ảnh!'), false); //
         // Hoặc dùng lỗi tùy chỉnh: cb(new Error('Chỉ được upload file hình ảnh!'), false);
    }
};

// Khởi tạo middleware multer với cấu hình storage, fileFilter và giới hạn kích thước
const upload = multer({ //
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// ------------------------

// --- Định nghĩa Route Upload ---
// POST /api/uploads/image
router.post(
    '/image', // Đường dẫn con cho upload ảnh
    (req, res, next) => { // Middleware kiểm tra nhanh trước khi xác thực
        logger.info('--- Received POST /api/uploads/image request ---'); //
        next();
    },
    protect,   // Middleware xác thực token: User phải đăng nhập
    isAdmin,   // Middleware kiểm tra quyền admin: User phải là Admin
    (req, res, next) => { // Middleware xử lý upload bằng multer
        logger.info(`User authenticated for upload: ${req.user?.customer_id || 'ID not found'}`); //
        // Sử dụng upload.single như một middleware.
        // Tham số 'productImage' là tên của field trong form-data gửi lên từ client.
        // Hàm callback (err) => {...} sẽ bắt lỗi từ multer (vd: file quá lớn, sai loại file)
        upload.single('productImage')(req, res, (err) => { //
            if (err) {
                logger.error('Error during multer processing:', err); // Log lỗi từ multer
                // Chuyển lỗi từ multer hoặc fileFilter đến error handler cuối cùng của Express
                return next(err); //
            }
            // Nếu không có lỗi từ multer, kiểm tra xem req.file có tồn tại không
            // (có thể không tồn tại nếu client không gửi file hoặc fieldname sai)
             if (!req.file) {
                logger.warn('Upload Warning: req.file is undefined after multer processing.'); //
                // Tạo lỗi để error handler cuối cùng xử lý
                return next(new Error('Không có file ảnh nào được tải lên hoặc file không hợp lệ.')); //
            }
             // Nếu mọi thứ ổn, chuyển sang controller chính (middleware tiếp theo)
             logger.info(`File received: ${req.file.filename}, Size: ${req.file.size}`); //
             next(); //
        });
    },
    (req, res, next) => { // Controller chính (chạy sau khi multer thành công và req.file tồn tại)
        try {
            // Tạo URL tương đối để lưu vào DB hoặc trả về client
            // Đường dẫn này sẽ được phục vụ bởi middleware static ở app.js
            const imageUrl = `/uploads/products/${req.file.filename}`; //
            logger.info(`Generated imageUrl: ${imageUrl}`); //

            // Chuẩn bị dữ liệu response thành công
            const responseData = {
                success: true,
                message: 'Hình ảnh đã được tải lên thành công',
                imageUrl: imageUrl // Trả về URL của ảnh
            }; //
            logger.info('--- Sending Success JSON Response ---:', responseData); //
            // *** Đảm bảo gửi JSON hợp lệ ***
            res.status(201).json(responseData); // Gửi response thành công (201 Created)

        } catch (error) {
            logger.error('Error in main upload controller:', error); //
            // Chuyển lỗi không mong muốn đến error handler cuối cùng
            next(error); //
        }
    }
);

// Middleware xử lý lỗi riêng cho route này (bắt lỗi từ multer hoặc controller ở trên)
// Middleware này PHẢI có 4 tham số (error, req, res, next) để Express nhận diện là error handler
router.use('/image', (error, req, res, next) => {
    logger.error("--- Upload Route Error Handler ---"); //
    logger.error("Error Object:", error); // Log chi tiết lỗi

    // Mặc định lỗi 500 nếu không xác định được
    let statusCode = 500; //
    let message = 'Internal server error during upload.';

    // Xử lý lỗi cụ thể từ Multer
    if (error instanceof multer.MulterError) { //
        statusCode = 400; // Lỗi từ client (vd: file quá lớn - LIMIT_FILE_SIZE, sai field - LIMIT_UNEXPECTED_FILE)
        message = `Upload error: ${error.message}`;
        if (error.code === 'LIMIT_FILE_SIZE') message = 'File ảnh quá lớn (tối đa 5MB).';
        if (error.code === 'LIMIT_UNEXPECTED_FILE' && error.message.includes('hình ảnh')) message = 'Chỉ được upload file hình ảnh!'; // Dùng message từ fileFilter
    } else if (error.message.includes('Chỉ được upload file hình ảnh') || error.message.includes('Không có file ảnh nào')) { // Lỗi tùy chỉnh từ middleware trước
        statusCode = 400; // Lỗi file không hợp lệ
        message = error.message; //
    }
    // Có thể thêm các kiểu lỗi khác ở đây

    logger.error(`Responding with status ${statusCode}: ${message}`); //
    // *** Đảm bảo gửi JSON hợp lệ ngay cả khi lỗi ***
    res.status(statusCode).json({ success: false, message: message }); //
});

module.exports = router; //