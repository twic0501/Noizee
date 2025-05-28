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
    const userFrontendUrlLocal = 'http://localhost:5173'; // FE User khi chạy local
const adminFrontendUrlLocal = 'http://localhost:5174'; // FE Admin khi chạy local

const userFrontendUrlProd = process.env.USER_FRONTEND_URL; // Sẽ đặt trên Render
const adminFrontendUrlProd = process.env.ADMIN_FRONTEND_URL; // Sẽ đặt trên Render

const allowedOrigins = [
    userFrontendUrlLocal,
    adminFrontendUrlLocal
];

if (userFrontendUrlProd) {
    allowedOrigins.push(userFrontendUrlProd);
    logger.info(`[CORS] Added USER_FRONTEND_URL to allowed origins: ${userFrontendUrlProd}`);
}
if (adminFrontendUrlProd) {
    allowedOrigins.push(adminFrontendUrlProd);
    logger.info(`[CORS] Added ADMIN_FRONTEND_URL to allowed origins: ${adminFrontendUrlProd}`);
}

// Nếu bạn vẫn muốn giữ biến FRONTEND_URL chung chung cho một FE chính hoặc mục đích khác
const legacyPrimaryFrontendUrl = process.env.FRONTEND_URL;
if (legacyPrimaryFrontendUrl && allowedOrigins.indexOf(legacyPrimaryFrontendUrl) === -1) {
    allowedOrigins.push(legacyPrimaryFrontendUrl);
    logger.info(`[CORS] Added legacy FRONTEND_URL to allowed origins: ${legacyPrimaryFrontendUrl}`);
}


logger.info(`[CORS] Final Allowed Origins: ${allowedOrigins.filter(Boolean).join(', ')}`);

const corsOptions = {
    origin: function (origin, callback) {
        // Lọc bỏ các giá trị null/undefined khỏi allowedOrigins trước khi kiểm tra
        const currentAllowedOrigins = allowedOrigins.filter(Boolean);
        if (!origin || currentAllowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`[CORS] Origin '<span class="math-inline">\{origin\}' not allowed\. Allowed list\: \[</span>{currentAllowedOrigins.join(', ')}]`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Thêm các method bạn dùng
    allowedHeaders: "Content-Type,Authorization,X-Client-Lang" // Thêm các header bạn dùng
};

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

    const graphqlPath = process.env.GRAPHQL_PATH || '/graphql'; //
    app.use(
        graphqlPath, //
        // cors(), // Đã được xử lý bởi middleware CORS toàn cục ở trên
        express.json(), //
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