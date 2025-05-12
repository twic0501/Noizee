// backend/app.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');

// >>> SỬA Ở ĐÂY: Import db từ models/index.js <<<
const db = require('./models'); // Đây là đối tượng db đã được models/index.js xử lý
const sequelize = db.sequelize; // Lấy sequelize instance từ db object này
const Customer = db.Customer; // Lấy model Customer (ví dụ)

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Hàm verifyToken của bạn
const verifyToken = (token) => {
    if (!token || !process.env.JWT_SECRET) {
        // logger.debug('[verifyToken] No token or JWT_SECRET missing');
        return null;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Quan trọng: Đảm bảo payload của token khi được tạo có dạng { user: { id: ..., isAdmin: ... } }
        // Hoặc nếu payload của bạn trực tiếp chứa id, isAdmin thì return decoded;
        // Dựa trên generateToken của bạn, nó sẽ là decoded.user
        return decoded.user || null; // Nếu không có decoded.user thì có thể là token không đúng định dạng
    } catch (err) {
        //logger.warn(`[verifyToken] Token verification failed: ${err.message}`);
        return null;
    }
};

async function createApp() {
    const app = express();
    app.use(cors()); // Cân nhắc cấu hình chặt chẽ hơn cho production
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    app.use((req, res, next) => {
        if (req.body?.operationName !== 'IntrospectionQuery' && req.url !== '/favicon.ico') {
            // logger.info(`[HTTP Request] ${req.method} ${req.originalUrl || req.path} - IP: ${req.ip}`);
        }
        next();
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/sales', saleRoutes);

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: process.env.NODE_ENV !== 'production',
        formatError: (formattedError, error) => { // Tùy chọn: custom format error để log rõ hơn
            logger.error("GraphQL Execution Error:", {
                message: formattedError.message,
                locations: formattedError.locations,
                path: formattedError.path,
                extensions: formattedError.extensions,
                originalError: error?.originalError // Log lỗi gốc nếu có
            });
            return formattedError;
        }
    });

    await server.start();
    logger.info('Apollo Server for backend has started.');

    const graphqlPath = process.env.GRAPHQL_PATH || '/graphql';
    app.use(
        graphqlPath,
        cors(), // Đảm bảo cors cho GraphQL endpoint
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                let userForContext = null;
                const authHeader = req.headers.authorization || '';
                const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
                const decodedPayload = verifyToken(token); 

                if (decodedPayload && decodedPayload.id) {
                    try {
                        // Lấy thông tin user TƯƠI từ DB để đảm bảo quyền là mới nhất
                        const dbUser = await Customer.findByPk(decodedPayload.id, {
                            attributes: ['customer_id', 'username', 'isAdmin', 'customer_name', 'customer_email', 'virtual_balance']
                        });

                        if (dbUser) {
                            // Xây dựng object user cho context, đảm bảo có isAdmin
                            userForContext = {
                                id: dbUser.customer_id,
                                username: dbUser.username,
                                isAdmin: dbUser.isAdmin, // <<<< GIÁ TRỊ NÀY PHẢI LÀ BOOLEAN true TỪ DB
                                name: dbUser.customer_name,
                                email: dbUser.customer_email,
                                virtual_balance: dbUser.virtual_balance
                            };
                            // console.log('[Backend Apollo Context] User populated for context:', userForContext);
                        } else {
                            logger.warn(`[Backend Apollo Context] User ID ${decodedPayload.id} from token not found in DB.`);
                        }
                    } catch (dbError) {
                        logger.error(`[Backend Apollo Context] DB Error fetching user ${decodedPayload.id}:`, dbError);
                    }
                } else if (token) { // Có token nhưng không giải mã được hoặc payload không hợp lệ
                    logger.warn('[Backend Apollo Context] Token provided but payload was invalid or missing expected fields (like id). Decoded:', decodedPayload);
                }
                // Truyền db và sequelize instance vào context nếu các resolver của bạn cần
                return { user: userForContext, db, sequelize };
            },
        })
    );

    app.get('/', (req, res) => {
        res.send('API Server is running. GraphQL available at ' + graphqlPath);
    });

    app.use(notFoundHandler);
    app.use(errorHandler); // Middleware xử lý lỗi phải ở cuối cùng
    return app;
}

module.exports = createApp;