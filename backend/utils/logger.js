// utils/logger.js
// Logger đơn giản sử dụng console.
// Có thể thay thế bằng thư viện logging mạnh mẽ hơn như Winston hoặc Pino cho production.
const logger = {
    info: (message) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`); //
    },
    warn: (message) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`); //
    },
    error: (message, error = '') => {
        // Log cả message và đối tượng error (nếu có) để xem stack trace
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error instanceof Error ? error : ''); //
    },
    debug: (message, ...args) => { // Cho phép truyền thêm tham số debug
        // Chỉ log debug ở môi trường development
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args); //
        }
    }
};

module.exports = logger;
// For more advanced logging, consider using Winston or Pino