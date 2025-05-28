// backend/app.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs'); //
const resolvers = require('./graphql/resolvers'); //
const logger = require('./utils/logger'); //
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware'); //
const { db, sequelize } = require('./config/db'); //
const { createLoaders } = require('./graphql/dataloaders'); //
const { redisClient } = require('./config/redisClient'); //

const authRoutes = require('./routes/authRoutes'); //
const productRoutes = require('./routes/productRoutes'); //
const saleRoutes = require('./routes/saleRoutes'); //
const uploadRoutes = require('./routes/uploadRoutes'); //

const TEMP_JWT_SECRET_FOR_APP_JS = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_at_least_32_characters_long'; //

const verifyTokenForContext = (tokenToVerify) => { //
    if (!tokenToVerify) { //
        return null;
    }
    if (!TEMP_JWT_SECRET_FOR_APP_JS || TEMP_JWT_SECRET_FOR_APP_JS.length < 32) { //
        logger.error("[verifyTokenForContext] FATAL ERROR: JWT_SECRET is not defined or is too short in app.js!"); //
        return null;
    }
    try {
        const decoded = jwt.verify(tokenToVerify, TEMP_JWT_SECRET_FOR_APP_JS); //
        return decoded.user || null; // Expects { id, username, isAdmin } //
    } catch (err) {
        // logger.warn('[verifyTokenForContext] Token verification failed:', { errorName: err.name, errorMessage: err.message });
        return null;
    }
};

async function createApp() { //
    const app = express();

    // --- BẮT ĐẦU CẤU HÌNH CORS ---
    const userFrontendUrlLocal = 'http://localhost:5173';
    const adminFrontendUrlLocal = 'http://localhost:5174';
    const userFrontendUrlProd = process.env.USER_FRONTEND_URL;
    const adminFrontendUrlProd = process.env.ADMIN_FRONTEND_URL; // VD: https://adminnoizee.netlify.app

    const allowedOrigins = [
        userFrontendUrlLocal,
        adminFrontendUrlLocal
    ];
    if (userFrontendUrlProd) allowedOrigins.push(userFrontendUrlProd);
    if (adminFrontendUrlProd) allowedOrigins.push(adminFrontendUrlProd);
    // Thêm URL của trang user production nếu có (ví dụ: process.env.USER_PROD_FRONTEND_URL)
    if (process.env.NOIZEE_FRONTEND_URL) { // Giả sử bạn có biến này cho trang noizee.netlify.app
        allowedOrigins.push(process.env.NOIZEE_FRONTEND_URL);
    }


    // Log các origin được phép để kiểm tra khi server khởi động
    const finalAllowedOrigins = allowedOrigins.filter(Boolean).map(url => {
    let normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    return normalizedUrl.toLowerCase(); // Chuyển sang chữ thường
});

logger.info(`[CORS Setup] Normalized (lowercase, no-trailing-slash) Final Allowed Origins for check: [${finalAllowedOrigins.join(', ')}]`);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) { // Cho phép nếu không có origin (Postman, curl trong một số trường hợp)
            return callback(null, true);
        }

        // Chuẩn hóa origin từ request: bỏ trailing slash và chuyển sang chữ thường
        let normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        normalizedOrigin = normalizedOrigin.toLowerCase(); // Chuyển sang chữ thường

        if (finalAllowedOrigins.includes(normalizedOrigin)) { // Sử dụng includes cho mảng đã chuẩn hóa
            callback(null, true);
        } else {
            logger.warn(`[CORS Check] Normalized Origin '<span class="math-inline">\{normalizedOrigin\}' \(from original '</span>{origin}') NOT ALLOWED. Normalized allowed list: [${finalAllowedOrigins.join(', ')}]`);
            callback(new Error(`Origin ${normalizedOrigin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,X-Client-Lang,X-apollo-operation-name,apollographql-client-name,apollographql-client-version"
};

    // ÁP DỤNG CORS TOÀN CỤC TRƯỚC TIÊN
    // Điều này quan trọng để xử lý preflight OPTIONS requests cho tất cả các route
    app.use(cors(corsOptions));
    // --- KẾT THÚC CẤU HÌNH CORS ---

    app.use(express.json()); //
    app.use(express.urlencoded({ extended: true })); //
    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); //

    // REST API Routes
    app.use('/api/auth', authRoutes); //
    app.use('/api/products', productRoutes); //
    app.use('/api/uploads', uploadRoutes); //
    app.use('/api/sales', saleRoutes); //

    const server = new ApolloServer({ //
        typeDefs, //
        resolvers, //
        introspection: process.env.NODE_ENV !== 'production', //
        formatError: (formattedError, error) => { //
            logger.error("GraphQL Execution Error:", { //
                message: formattedError.message, //
                locations: formattedError.locations, //
                path: formattedError.path, //
                extensions_code: formattedError.extensions?.code, //
                originalError_name: error?.originalError?.name, //
                originalError_message: error?.originalError?.message, //
            });
            return {
                message: formattedError.message, //
                locations: formattedError.locations, //
                path: formattedError.path, //
                extensions: formattedError.extensions, //
            };
        }
    });

    await server.start(); //
    logger.info('Apollo Server for backend has started.'); //

    const graphqlPath = process.env.GRAPHQL_PATH || '/graphql';
    logger.info(`[APOLLO] GraphQL path set to: ${graphqlPath}`);
    app.options(graphqlPath, cors(corsOptions)); //
    app.use(
        graphqlPath, //
        // cors(), // Đã được xử lý bởi middleware CORS toàn cục ở trên
        express.json(), //
        cors(corsOptions),
        expressMiddleware(server, { //
            context: async ({ req }) => { //
                let userForContext = null; //
                const authHeader = req.headers.authorization || ''; //
                let token = null; //

                if (authHeader.startsWith('Bearer ')) { //
                    token = authHeader.substring(7); //
                }

                const decodedUserFromToken = verifyTokenForContext(token); //
                // logger.debug('[Apollo Context] Decoded user from token:', decodedUserFromToken);


                if (decodedUserFromToken && decodedUserFromToken.id !== undefined) { //
                    const userIdFromToken = parseInt(decodedUserFromToken.id, 10); // Ensure it's an integer //
                    // logger.debug(`[Apollo Context] Attempting to find user in DB with ID: ${userIdFromToken} (Type: ${typeof userIdFromToken})`);

                    if (isNaN(userIdFromToken)) { //
                        logger.warn(`[Apollo Context] Invalid user ID from token after parsing: ${decodedUserFromToken.id}`); //
                    } else {
                        try {
                            const dbUser = await db.Customer.findByPk(userIdFromToken, { //
                                attributes: ['customer_id', 'username', 'isAdmin', 'customer_name', 'customer_email', 'virtual_balance'] //
                            });

                            if (dbUser) { //
                                // logger.debug(`[Apollo Context] User FOUND in DB: ID ${dbUser.customer_id}, isAdmin (raw from DB via getter): ${dbUser.isAdmin}`);
                                // The getter in Customer.js model ensures dbUser.isAdmin is boolean
                                if (dbUser.isAdmin === true) { //
                                    userForContext = { //
                                        id: dbUser.customer_id, //
                                        username: dbUser.username, //
                                        isAdmin: true, // Explicitly true //
                                        name: dbUser.customer_name, //
                                        email: dbUser.customer_email, //
                                        virtual_balance: dbUser.virtual_balance //
                                    };
                                    // logger.debug('[Apollo Context] Admin user context SET:', userForContext);
                                } else {
                                    // logger.warn(`[Apollo Context] User ID ${userIdFromToken} found in DB but is NOT an admin. isAdmin value: ${dbUser.isAdmin}`);
                                     userForContext = { // Still set basic user info if not admin, but isAdmin will be false //
                                        id: dbUser.customer_id, //
                                        username: dbUser.username, //
                                        isAdmin: false, //
                                         name: dbUser.customer_name, //
                                        email: dbUser.customer_email, //
                                    };
                                }
                            } else {
                                // This is the log you are seeing:
                                logger.warn(`[Apollo Context] User ID ${userIdFromToken} from token NOT FOUND in DB.`); //
                                // userForContext remains null
                            }
                        } catch (dbError) {
                            logger.error(`[Apollo Context] DB Error fetching user by ID ${userIdFromToken}:`, dbError); //
                            // userForContext remains null
                        }
                    }
                } else if (token) { //
                    // logger.warn('[Apollo Context] Token provided but payload was invalid or user ID missing.');
                }

                let lang = 'vi'; //
                const clientLangHeader = req.headers['x-client-lang']; //
                const acceptLangHeader = req.headers['accept-language']; //
                if (clientLangHeader && ['vi', 'en'].includes(clientLangHeader)) { //
                    lang = clientLangHeader; //
                } else if (req.query.lang && ['vi', 'en'].includes(req.query.lang)) { //
                    lang = req.query.lang; //
                } else if (acceptLangHeader) { //
                    const firstPreferredLang = acceptLangHeader.split(',')[0].toLowerCase(); //
                    if (firstPreferredLang.startsWith('en')) lang = 'en'; //
                }

                return {
                    user: userForContext, // This will be null if user not found or not admin, or will have isAdmin: true/false //
                    db, //
                    sequelize, //
                    lang, //
                    loaders: createLoaders(db), //
                    redis: redisClient //
                };
            },
        })
    );

    app.get('/', (req, res) => res.send(`API Server is running. GraphQL available at ${graphqlPath}`)); //
    app.use(notFoundHandler); //
    app.use(errorHandler); //

    return app;
}

module.exports = createApp; //