// backend/config/redisClient.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Ưu tiên REDIS_URL nếu có (Render Redis thường cung cấp URL này)
// Nếu không, dùng REDIS_HOST và REDIS_PORT
const redisUrl = process.env.REDIS_URL;
const redisHostFromEnv = process.env.REDIS_HOST;
const redisPortFromEnv = process.env.REDIS_PORT;
logger.info(`[Redis Init] ENV REDIS_URL: ${redisUrl}`);
logger.info(`[Redis Init] ENV REDIS_HOST: ${redisHostFromEnv}`);
logger.info(`[Redis Init] ENV REDIS_PORT: ${redisPortFromEnv}`);

let connectionOptions;
let shouldConnectRedis = false; // Mặc định là không kết nối

if (redisUrl) {
    connectionOptions = redisUrl;
    logger.info(`[Redis] Configuring connection using REDIS_URL.`);
    shouldConnectRedis = true;
} else if (redisHostFromEnv) { // Chỉ khi REDIS_HOST được định nghĩa
    connectionOptions = {
        host: redisHostFromEnv,
        port: parseInt(redisPortFromEnv, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        // Các options khác như retryStrategy, connectTimeout có thể giữ nguyên hoặc điều chỉnh
        retryStrategy(times) {
            const delay = Math.min(times * 100, 2000);
            if (times > 5) { // Giảm số lần thử lại để tránh treo lâu khi khởi động nếu có vấn đề
                logger.error(`[Redis] Max connection retries reached for ${connectionOptions.host || 'target'}. Giving up.`);
                return undefined; // Ngừng thử lại
            }
            logger.warn(`[Redis] Retrying connection (attempt ${times}). Delaying for ${delay}ms.`);
            return delay;
        },
        connectTimeout: 3000, // Giảm thời gian chờ kết nối một chút
    };
    logger.info(`[Redis] Configuring connection using REDIS_HOST: ${redisHostFromEnv}.`);
    shouldConnectRedis = true;
} else {
    // Log này nên xuất hiện trên Render nếu bạn không đặt REDIS_URL/REDIS_HOST
    logger.warn('[Redis] REDIS_URL or REDIS_HOST not defined. Redis client will NOT attempt to connect. Caching will be disabled.');
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
    logger.warn('[Redis] Using MOCK Redis client. Caching will be disabled.');
    redisClient = {
        get: async (key) => { logger.debug(`[Mock Redis] GET ${key} -> null`); return null; },
        set: async (key, value, ...args) => { logger.debug(`[Mock Redis] SET ${key}`); return 'OK'; },
        del: async (key) => { logger.debug(`[Mock Redis] DEL ${key}`); return 1; },
        on: () => {},
        quit: async () => { logger.debug('[Mock Redis] QUIT'); },
        status: 'mocked',
        isRedisConnected: false // Thêm trạng thái này cho mock client
    };
    isRedisConnected = false;
} else {
    // Nếu redisClient được khởi tạo thực sự, isRedisConnected sẽ được cập nhật bởi event 'ready' hoặc 'error'/'close'
    // nhưng giá trị ban đầu có thể là false.
    // Để đơn giản, bạn có thể dựa vào event 'ready' để set isRedisConnected = true
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