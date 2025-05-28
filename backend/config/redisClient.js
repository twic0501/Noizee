// backend/config/redisClient.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Ưu tiên REDIS_URL nếu có (Render Redis thường cung cấp URL này)
// Nếu không, dùng REDIS_HOST và REDIS_PORT
const redisUrl = process.env.REDIS_URL;
const redisHostFromEnv = process.env.REDIS_HOST;
const redisPortFromEnv = process.env.REDIS_PORT;

let connectionOptions;
let shouldConnectRedis = false;

if (redisUrl) {
    connectionOptions = redisUrl; // IORedis có thể nhận URL trực tiếp
    logger.info(`[Redis] Configuring connection using REDIS_URL.`);
    shouldConnectRedis = true;
} else if (redisHostFromEnv) { // Chỉ kết nối nếu REDIS_HOST được cung cấp
    connectionOptions = {
        host: redisHostFromEnv,
        port: parseInt(redisPortFromEnv, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy(times) {
            const delay = Math.min(times * 100, 2000);
            // Không log retry nếu chúng ta quyết định không kết nối ngay từ đầu
            // logger.warn(`[Redis] Retrying connection to ${connectionOptions.host}:${connectionOptions.port} (attempt ${times}). Delaying for ${delay}ms.`);
            if (times > 5) { // Giảm số lần thử lại để tránh treo lâu khi khởi động
                logger.error(`[Redis] Max connection retries reached for ${connectionOptions.host}:${connectionOptions.port}. Giving up initial connect.`);
                return undefined;
            }
            return delay;
        },
        maxRetriesPerRequest: 3,
        showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
        // lazyConnect: true, // Có thể bỏ lazyConnect nếu bạn muốn nó thử kết nối ngay
        connectTimeout: 5000, // Tăng thời gian chờ kết nối lên một chút
    };
    logger.info(`[Redis] Configuring connection using REDIS_HOST: ${redisHostFromEnv}.`);
    shouldConnectRedis = true;
} else {
    logger.warn('[Redis] REDIS_URL or REDIS_HOST not defined in environment variables. Redis client will not attempt to connect. Caching will be disabled.');
    // Không cần tạo client giả nếu không có ý định kết nối
}

let redisClient = null; // Khởi tạo là null
let isRedisConnected = false;

if (shouldConnectRedis) {
    try {
        redisClient = new Redis(connectionOptions);

        redisClient.on('connect', () => {
            const target = typeof connectionOptions === 'string' ? connectionOptions : `${connectionOptions.host}:${connectionOptions.port}`;
            logger.info(`[Redis] Initiating connection to Redis server at ${target}...`);
        });

        redisClient.on('ready', () => {
            const target = typeof connectionOptions === 'string' ? connectionOptions : `${connectionOptions.host}:${connectionOptions.port}`;
            logger.info(`[Redis] Client is ready. Connected to ${target}.`);
            isRedisConnected = true;
        });

        redisClient.on('error', (err) => {
            logger.error('[Redis] Connection or command error:', {
                message: err.message,
                code: err.code,
            });
            isRedisConnected = false; // Đặt lại trạng thái nếu có lỗi
        });

        redisClient.on('close', () => {
            logger.info('[Redis] Connection to Redis server closed.');
            isRedisConnected = false;
        });

        redisClient.on('reconnecting', (delay) => {
            logger.info(`[Redis] Client is reconnecting in ${delay}ms...`);
        });

        redisClient.on('end', () => {
            logger.info('[Redis] Connection to Redis server ended. Client will not try to reconnect.');
            isRedisConnected = false;
        });

        // Nếu không dùng lazyConnect, nó sẽ tự kết nối.
        // Nếu dùng lazyConnect, bạn cần gọi redisClient.connect() ở đâu đó một cách có chủ đích.
        // Để đơn giản cho việc khởi động, có thể bỏ lazyConnect.
        // Hoặc nếu vẫn dùng lazyConnect, đảm bảo lỗi từ .connect() không làm sập app.
        // Đoạn `redisClient.connect().catch(...)` trong code gốc của bạn là tốt để bắt lỗi.
        // Tuy nhiên, nếu shouldConnectRedis là false, chúng ta sẽ không chạy đoạn này.

        // Nếu bạn muốn thử kết nối ngay khi khởi tạo (bỏ lazyConnect hoặc gọi connect ở đây):
        // This will attempt to connect immediately if not using lazyConnect
        // or if you explicitly call connect.
        // Make sure this doesn't crash the app if Redis is not available but shouldConnectRedis is true.
        // The 'error' event handler above should catch connection errors.

    } catch (error) {
        logger.error('[Redis] Failed to initialize Redis client instance:', error);
        redisClient = null; // Đảm bảo client là null nếu có lỗi khởi tạo
    }
}

// Nếu redisClient vẫn là null, tạo một client giả để các phần khác của ứng dụng không bị lỗi
if (!redisClient) {
    logger.warn('[Redis] Using mock Redis client as connection is not configured or failed. Caching will be disabled.');
    redisClient = {
        get: async (key) => { logger.debug(`[Mock Redis] GET ${key} -> null`); return null; },
        set: async (key, value, ...args) => { logger.debug(`[Mock Redis] SET ${key} ${value} ${args.join(' ')} -> OK`); return 'OK'; },
        del: async (key) => { logger.debug(`[Mock Redis] DEL ${key} -> 1`); return 1; },
        on: () => {}, // No-op
        quit: async () => { logger.debug('[Mock Redis] QUIT'); },
        status: 'mocked_due_to_no_config_or_init_error',
        options: {},
        // Thêm các hàm bạn hay dùng khác nếu cần
    };
    isRedisConnected = false; // Chắc chắn trạng thái là false
}


const closeRedisConnection = async () => {
    if (redisClient && shouldConnectRedis && typeof redisClient.quit === 'function' && redisClient.status !== 'mocked_due_to_no_config_or_init_error') {
        logger.info('[Redis] Closing Redis connection gracefully...');
        try {
            await redisClient.quit();
            logger.info('[Redis] Connection closed successfully.');
        } catch (err) {
            logger.error('[Redis] Error during graceful shutdown:', err);
        }
    } else if (redisClient && redisClient.status === 'mocked_due_to_no_config_or_init_error') {
        logger.info('[Redis] Mock client, no actual connection to close.');
    } else {
        logger.info(`[Redis] Client not connected or already closed, no quit command sent.`);
    }
};

module.exports = { redisClient, closeRedisConnection, isRedisConnected }; // Export thêm isRedisConnected