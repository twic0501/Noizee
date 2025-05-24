const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const logger = require('./utils/logger');
const createApp = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql';

let serverCleanup = null;

async function start() {
    try {
        // Kết nối database
        logger.info('Attempting to connect to the database...');
        await connectDB();
        logger.info('Database connection successful.');

        // Tạo app và server
        logger.info('Creating Express app with Apollo Server...');
        const { app, httpServer, cleanup } = await createApp();
        serverCleanup = cleanup;
        logger.info('Express app created successfully.');

        // Start server
        httpServer.listen(PORT, () => {
            logger.info(` 🚀  Server ready and listening on port ${PORT}`);
            logger.info(`    - Mode: ${NODE_ENV}`);
            logger.info(`    - HTTP: http://localhost:${PORT}`);
            logger.info(`    - GraphQL: http://localhost:${PORT}${GRAPHQL_PATH}`);
            logger.info(`    - WebSocket: ws://localhost:${PORT}${GRAPHQL_PATH}`);
        });

        // Xử lý lỗi server
        httpServer.on('error', (error) => {
            if (error.syscall !== 'listen') throw error;
            const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
            
            switch (error.code) {
                case 'EACCES':
                    logger.error(`${bind} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(`${bind} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

    } catch (error) {
        logger.error(' 💥  Failed to start application server:');
        logger.error(error);
        process.exit(1);
    }
}

// Xử lý graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    if (serverCleanup) {
        try {
            await serverCleanup.dispose();
            logger.info('WebSocket server cleaned up.');
        } catch (error) {
            logger.error('Error during WebSocket cleanup:', error);
        }
    }

    process.exit(0);
}

// Handle process signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:');
    logger.error(err.stack);
    process.exit(1);
});

// Start server
start();