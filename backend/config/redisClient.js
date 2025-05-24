// backend/config/redisClient.js
const Redis = require('ioredis');
const logger = require('../utils/logger'); // Sử dụng logger đã nâng cấp của bạn (Winston)

// Lấy thông tin kết nối Redis từ biến môi trường hoặc dùng giá trị mặc định
// Redis server đang chạy trong WSL sẽ có thể truy cập qua localhost từ Windows
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
// const redisPassword = process.env.REDIS_PASSWORD; // Bỏ comment nếu Redis server của bạn có mật khẩu

const connectionOptions = {
    host: redisHost,
    port: redisPort,
    // password: redisPassword, // Bỏ comment nếu có mật khẩu
    retryStrategy(times) {
        // Chiến lược thử lại kết nối nếu thất bại
        // Thử lại tối đa 20 lần, mỗi lần cách nhau tối đa 2 giây
        const delay = Math.min(times * 100, 2000); // Tăng dần thời gian chờ, tối đa 2s
        logger.warn(`[Redis] Retrying connection to ${redisHost}:${redisPort} (attempt ${times}). Delaying for ${delay}ms.`);
        if (times > 20) { // Giới hạn số lần thử lại
            logger.error(`[Redis] Max connection retries reached for ${redisHost}:${redisPort}. Giving up.`);
            return undefined; // Ngừng thử lại
        }
        return delay;
    },
    maxRetriesPerRequest: 3, // Số lần thử lại cho một command nếu kết nối bị gián đoạn
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production', // Hiển thị stack lỗi thân thiện hơn ở dev
    lazyConnect: true, // Chỉ kết nối khi có command đầu tiên được thực thi (hoặc gọi .connect())
};

let redisClient;

try {
    redisClient = new Redis(connectionOptions);

    redisClient.on('connect', () => {
        logger.info(`[Redis] Initiating connection to Redis server at ${redisHost}:${redisPort}...`);
    });

    redisClient.on('ready', () => {
        // Sự kiện 'ready' được phát ra sau khi 'connect' và client sẵn sàng nhận lệnh.
        logger.info(`[Redis] Client is ready to use. Connected to ${redisHost}:${redisPort}.`);
    });

    redisClient.on('error', (err) => {
        logger.error('[Redis] Connection or command error:', {
            message: err.message,
            code: err.code,
            // stack: err.stack // Có thể quá dài, cân nhắc log ở debug level
        });
        // Trong môi trường production, bạn có thể muốn ứng dụng vẫn chạy mà không có cache,
        // hoặc có cơ chế fallback. Không nên để ứng dụng crash chỉ vì Redis lỗi.
    });

    redisClient.on('close', () => {
        logger.info(`[Redis] Connection to ${redisHost}:${redisPort} closed.`);
    });

    redisClient.on('reconnecting', (delay) => {
        logger.info(`[Redis] Client is reconnecting to ${redisHost}:${redisPort} in ${delay}ms...`);
    });

    redisClient.on('end', () => {
        // Sự kiện này được phát ra khi client sẽ không thử kết nối lại nữa (ví dụ sau khi gọi .quit() hoặc retryStrategy trả về undefined)
        logger.info(`[Redis] Connection to ${redisHost}:${redisPort} ended. Client will not try to reconnect.`);
    });

    // Chủ động kết nối nếu dùng lazyConnect: true
    // Hoặc bỏ lazyConnect và nó sẽ tự kết nối khi khởi tạo new Redis()
    redisClient.connect().catch(err => {
        logger.error('[Redis] Failed to connect during initial explicit connect():', err);
    });

} catch (error) {
    logger.error('[Redis] Failed to initialize Redis client:', error);
    // Tạo một client giả để ứng dụng không bị crash nếu không thể khởi tạo Redis
    // Điều này cho phép ứng dụng chạy mà không có caching.
    redisClient = {
        get: async () => null,
        set: async () => null,
        del: async () => null,
        quit: async () => {},
        on: () => {}, // No-op
        connect: async () => { throw new Error("Redis client initialization failed."); },
        status: 'uninitialized_error',
        options: {}
    };
    logger.warn('[Redis] Application will run without caching due to Redis client initialization failure.');
}


// Hàm để đóng kết nối một cách an toàn khi ứng dụng thoát
const closeRedisConnection = async () => {
    if (redisClient && typeof redisClient.quit === 'function' && (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'reconnecting')) {
        logger.info('[Redis] Closing Redis connection gracefully...');
        try {
            await redisClient.quit();
            logger.info('[Redis] Connection closed successfully.');
        } catch (err) {
            logger.error('[Redis] Error during graceful shutdown:', err);
        }
    } else if (redisClient) {
        logger.info(`[Redis] Client status is '${redisClient.status}', no quit command sent.`);
    }
};

// Xử lý graceful shutdown cho ứng dụng Node.js
// process.on('SIGINT', async () => {
//     logger.info('SIGINT received. Shutting down gracefully...');
//     await closeRedisConnection();
//     process.exit(0);
// });
// process.on('SIGTERM', async () => {
//     logger.info('SIGTERM received. Shutting down gracefully...');
//     await closeRedisConnection();
//     process.exit(0);
// });

module.exports = { redisClient, closeRedisConnection };
