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
const { db, sequelize } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const verifyToken = (tokenToVerify) => {
    if (!tokenToVerify) {
        return null;
    }
    if (!process.env.JWT_SECRET) {
        logger.error("[verifyToken] FATAL ERROR: JWT_SECRET is not defined in .env file!");
        return null;
    }
    try {
        const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
        return decoded.user || null;
    } catch (err) {
        console.error("!!! DEBUG: Token Verification Error Details !!!");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        console.error("Token (first 20 chars):", tokenToVerify.substring(0, 20) + '...');
        logger.warn('[verifyToken] Token verification failed:', {
            errorName: err.name,
            errorMessage: err.message,
            tokenAttempted: tokenToVerify.substring(0, 20) + '...'
        });
        return null;
    }
};

async function createApp() {
    const app = express();
    app.use(cors());
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
    console.log("!!! DEBUG: JWT_SECRET from process.env in app.js:", process.env.JWT_SECRET);

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: process.env.NODE_ENV !== 'production',
        formatError: (formattedError, error) => {
            logger.error("GraphQL Execution Error:", {
                message: formattedError.message,
                locations: formattedError.locations,
                path: formattedError.path,
                extensions: formattedError.extensions,
                originalErrorName: error?.originalError?.name,
                originalErrorMessage: error?.originalError?.message,
            });
            return formattedError;
        }
    });

    await server.start();
    logger.info('Apollo Server for backend has started.');
    
    const graphqlPath = process.env.GRAPHQL_PATH || '/graphql';
    app.use(
        graphqlPath,
        cors(),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                let userForContext = null;
                const authHeader = req.headers.authorization || '';
                
                // Khởi tạo token, giá trị sẽ được gán nếu header hợp lệ
                let token = null; 

                if (authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7); // Lấy token
                    // logger.debug('[Apollo Context] Token extracted from Authorization header:', token.substring(0, 20) + '...');
                } else if (authHeader) { // Nếu có authHeader nhưng không phải Bearer
                    logger.warn('[Apollo Context] Authorization header found, but not a Bearer token.');
                }

                // Chỉ gọi verifyToken một lần
                const decodedUserFromToken = verifyToken(token);
                // logger.debug('[Apollo Context] Decoded user payload from verifyToken:', decodedUserFromToken);

                if (decodedUserFromToken && decodedUserFromToken.id) {
                    // logger.debug(`[Apollo Context] Valid user payload from token. User ID: ${decodedUserFromToken.id}, isAdmin from token: ${decodedUserFromToken.isAdmin}`);
                    if (db && db.Customer) { // Kiểm tra db.Customer trước khi sử dụng
                        try {
                            const dbUser = await db.Customer.findByPk(decodedUserFromToken.id, {
                                attributes: ['customer_id', 'username', 'isAdmin', 'customer_name', 'customer_email', 'virtual_balance']
                            });

                            if (dbUser) {
                                // logger.debug(`[Apollo Context] User found in DB. DB isAdmin: ${dbUser.isAdmin}, DB User data:`, dbUser.toJSON());
                                userForContext = {
                                    id: dbUser.customer_id,
                                    username: dbUser.username,
                                    isAdmin: dbUser.isAdmin, // Đảm bảo đây là boolean từ DB
                                    name: dbUser.customer_name,
                                    email: dbUser.customer_email,
                                    virtual_balance: dbUser.virtual_balance
                                };
                                // logger.debug('[Apollo Context] User object constructed for context:', userForContext);
                            } else {
                                logger.warn(`[Apollo Context] User ID ${decodedUserFromToken.id} from token NOT FOUND in DB.`);
                            }
                        } catch (dbError) {
                            logger.error(`[Apollo Context] DB Error fetching user by ID ${decodedUserFromToken.id}:`, dbError);
                        }
                    } else {
                        logger.error("[Apollo Context] db.Customer model is not available. Check model loading in models/index.js.");
                    }
                } else if (token) { // Nếu có token nhưng verify không thành công hoặc payload không hợp lệ
                    logger.warn('[Backend Apollo Context] Token provided but payload was invalid or missing expected fields (like id). Decoded from token attempt:', decodedUserFromToken);
                }

                let lang = 'vi'; // Ngôn ngữ mặc định
                // Ưu tiên lấy lang từ query param nếu có và hợp lệ
                if (req.query.lang && ['vi', 'en'].includes(req.query.lang)) {
                    lang = req.query.lang;
                } else if (req.headers['accept-language']) { // Sau đó thử lấy từ header
                    const acceptedLangs = req.headers['accept-language'].split(',');
                    if (acceptedLangs[0].startsWith('en')) lang = 'en';
                    // Bạn có thể thêm logic phức tạp hơn để xử lý accept-language nếu cần
                }
                // logger.debug(`[Apollo Context] Language set to: ${lang}`);
                
                return { user: userForContext, db, sequelize, lang };
            },
        })
    );

    app.get('/', (req, res) => res.send(`API Server is running. GraphQL available at ${graphqlPath}`));
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}

module.exports = createApp;
