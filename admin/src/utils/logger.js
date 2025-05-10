// admin-frontend/src/utils/logger.js
const logger = {
    info: (...args) => {
        if (import.meta.env.DEV) { // Chỉ log info ở development
            console.log(`[ADMIN INFO] ${new Date().toISOString()}:`, ...args);
        }
    },
    warn: (...args) => {
        console.warn(`[ADMIN WARN] ${new Date().toISOString()}:`, ...args);
    },
    error: (message, ...errorDetails) => { // Nhận errorDetails là một mảng
        console.error(`[ADMIN ERROR] ${new Date().toISOString()}: ${message}`, ...errorDetails);
    },
    debug: (message, ...args) => {
        if (import.meta.env.DEV) {
            console.debug(`[ADMIN DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
        }
    }
};

export default logger;