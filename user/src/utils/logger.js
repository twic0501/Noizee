// src/utils/logger.js (User Frontend Logger)
const logger = {
    info: (...args) => {
        if (import.meta.env.DEV) {
            console.log(`[USER FE INFO] ${new Date().toISOString()}:`, ...args);
        }
    },
    warn: (...args) => {
        console.warn(`[USER FE WARN] ${new Date().toISOString()}:`, ...args);
    },
    error: (message, ...errorDetails) => {
        console.error(`[USER FE ERROR] ${new Date().toISOString()}: ${message}`, ...errorDetails);
    },
    debug: (message, ...args) => {
        if (import.meta.env.DEV) {
            console.debug(`[USER FE DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
        }
    }
};

export default logger;