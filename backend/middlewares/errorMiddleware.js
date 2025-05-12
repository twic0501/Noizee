// middlewares/errorMiddleware.js (Phiên bản hoàn chỉnh - Đã rất tốt)
const logger = require('../utils/logger'); // Import logger

/**
 * Middleware xử lý lỗi tập trung.
 * Middleware này phải được đặt SAU TẤT CẢ các routes và middleware khác trong app.js.
 */
const errorHandler = (err, req, res, next) => {
    // Xác định status code: Ưu tiên status được gắn vào error object,
    // sau đó là status đã được set trong response, cuối cùng là 500.
    const statusCode = err.status || (res.statusCode && res.statusCode >= 400 ? res.statusCode : 500); //

    // Log lỗi chi tiết ở phía server
    // Bao gồm cả stack trace để dễ dàng tìm nguồn gốc lỗi
    logger.error(
        `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
        // Chỉ log stack đầy đủ nếu không phải lỗi 404 (lỗi 404 thường không cần stack)
        statusCode !== 404 ? err.stack : ''
    ); //

    // Chỉ gửi message lỗi về cho client
    res.status(statusCode).json({
        message: err.message || 'Đã xảy ra lỗi không mong muốn trên máy chủ.',
        // Chỉ gửi stack trace về client khi ở môi trường development
        // TUYỆT ĐỐI KHÔNG gửi stack trace ở production
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }); //
};

/**
 * Middleware xử lý khi không tìm thấy route (404 Not Found).
 * Middleware này nên được đặt NGAY TRƯỚC errorHandler.
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Không tìm thấy đường dẫn - ${req.originalUrl}`); //
    res.status(404); // Set status code là 404
    next(error);     // Chuyển lỗi này tới errorHandler để xử lý tập trung
};

module.exports = { errorHandler, notFoundHandler }; //