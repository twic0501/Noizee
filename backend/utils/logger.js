// backend/utils/logger.js (Nâng cấp với Winston)
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, align, json, errors } = winston.format;

// Xác định thư mục logs từ thư mục gốc của dự án
// __dirname ở đây là backend/utils, đi lên 1 cấp ('..') là backend/
const logsDir = path.join(__dirname, '..', 'logs');

// Tạo thư mục logs nếu nó chưa tồn tại
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
    } catch (err) {
        // Nếu không tạo được thư mục logs, ghi lỗi ra console và tiếp tục với console transport
        console.error("Could not create logs directory:", err);
    }
}

// Xác định level log dựa trên môi trường
const logLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// Định dạng log cho console (có màu sắc và dễ đọc)
const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    align(),
    printf((info) => {
        // Nếu có stack trace, in nó ra ở dòng mới
        const stack = info.stack ? `\nStack: ${info.stack}` : '';
        // Nếu có metadata (ví dụ: đối tượng lỗi đầy đủ), in nó ra
        let metaString = '';
        const splat = info[Symbol.for('splat')];
        if (splat && splat.length) {
            metaString = splat.map(meta => {
                if (meta instanceof Error && meta.stack) return `\nError Details: ${meta.stack}`;
                if (typeof meta === 'object') return `\nDetails: ${JSON.stringify(meta, null, 2)}`;
                return meta;
            }).join(' ');
        }
        return `[${info.timestamp}] ${info.level}: ${info.message}${stack}${metaString}`;
    })
);

// Định dạng log cho file (thường là JSON để dễ parse)
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }), // Log stack trace cho lỗi
    json() // Ghi log dưới dạng JSON
);

const transports = [
    // Luôn log ra console
    new winston.transports.Console({
        level: logLevel, // Level cho console có thể khác file nếu muốn
        format: consoleFormat,
        handleExceptions: true, // Bắt uncaught exceptions ở console
        handleRejections: true  // Bắt unhandled rejections ở console
    })
];

// Chỉ thêm File transport nếu thư mục logs tồn tại (để tránh lỗi nếu không tạo được)
if (fs.existsSync(logsDir)) {
    transports.push(
        // Ghi tất cả logs (từ level đã định nghĩa trở lên) ra file combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            level: logLevel, // Ghi tất cả các level từ logLevel trở lên
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5, // Giữ lại 5 file log cũ
            tailable: true,
            handleExceptions: true, // Bắt uncaught exceptions
            handleRejections: true
        })
    );
    transports.push(
        // Ghi riêng các log lỗi (level 'error') ra file error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            tailable: true,
            handleExceptions: true,
            handleRejections: true
        })
    );
} else {
    console.warn("[Logger] Logs directory does not exist. File transport will not be enabled.");
}


const logger = winston.createLogger({
  level: logLevel, // Level log mặc định cho logger
  format: consoleFormat, // Format mặc định (sẽ được override bởi transport nếu transport có format riêng)
  transports: transports,
  exitOnError: false, // Không thoát ứng dụng khi có lỗi được logger bắt (PM2 sẽ quản lý việc restart)
});

// Ghi đè console.log, console.error, v.v. để sử dụng logger của Winston (Tùy chọn)
// Điều này giúp bạn không cần thay đổi các lệnh console.log hiện có trong code
// Tuy nhiên, nên cân nhắc việc gọi trực tiếp logger.info, logger.error để có kiểm soát tốt hơn.
/*
if (process.env.NODE_ENV !== 'test') { // Không ghi đè khi chạy test để dễ xem output test
    console.log = (...args) => logger.info.call(logger, ...args);
    console.info = (...args) => logger.info.call(logger, ...args);
    console.warn = (...args) => logger.warn.call(logger, ...args);
    console.error = (...args) => {
        if (args[0] instanceof Error) {
            logger.error.call(logger, args[0].message, { error: args[0] });
        } else {
            logger.error.call(logger, ...args);
        }
    };
    console.debug = (...args) => logger.debug.call(logger, ...args);
}
*/

// Thêm một stream interface cho Morgan (HTTP request logger) nếu bạn dùng
// logger.stream = {
//     write: function(message, encoding) {
//         logger.info(message.trim());
//     },
// };

module.exports = logger;
