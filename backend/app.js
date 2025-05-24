// backend/app.js
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('@graphql-tools/schema');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { db, sequelize } = require('./config/db'); // sequelize is exported from db config
const { createLoaders } = require('./graphql/dataloaders');
const { redisClient } = require('./config/redisClient');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const TEMP_JWT_SECRET_FOR_APP_JS = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_at_least_32_characters_long';

const verifyTokenForContext = (tokenToVerify) => {
    if (!tokenToVerify) {
        return null;
    }
    if (!TEMP_JWT_SECRET_FOR_APP_JS || TEMP_JWT_SECRET_FOR_APP_JS.length < 32) {
        logger.error("[verifyTokenForContext] FATAL ERROR: JWT_SECRET is not defined or is too short in app.js!");
        return null;
    }
    try {
        const decoded = jwt.verify(tokenToVerify, TEMP_JWT_SECRET_FOR_APP_JS);
        return decoded.user || null; // Expects { id, username, isAdmin }
    } catch (err) {
        // logger.warn('[verifyTokenForContext] Token verification failed:', { errorName: err.name, errorMessage: err.message });
        return null;
    }
};

async function createApp() {
    const app = express();
    const httpServer = createServer(app);
    
    // Định nghĩa graphqlPath ở đầu function để có thể sử dụng trong toàn bộ scope
    const graphqlPath = process.env.GRAPHQL_PATH || '/graphql';

    // Create WebSocket server với graphqlPath
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: graphqlPath,
    });

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // WebSocket context setup
    const serverCleanup = useServer({
        schema,
        context: async (ctx) => {
            if (ctx.connectionParams?.authorization) {
                const token = ctx.connectionParams.authorization.replace('Bearer ', '');
                const decodedUser = verifyTokenForContext(token);
                if (decodedUser && decodedUser.id !== undefined) {
                    try {
                        const userFromDb = await db.Customer.findByPk(decodedUser.id, {
                            attributes: ['customer_id', 'isAdmin']
                        });
                        if (userFromDb?.isAdmin === true) {
                            return {
                                user: {
                                    id: userFromDb.customer_id,
                                    isAdmin: true
                                }
                            };
                        }
                    } catch(dbError) {
                        logger.error(`[WS Context] DB Error:`, dbError);
                    }
                }
            }
            return { user: null };
        },
    }, wsServer);

    // CORS và middleware setup
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

    // REST API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/sales', saleRoutes);

    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    await server.start();
    logger.info('Apollo Server for backend has started.');

    // GraphQL middleware
    app.use(
        graphqlPath,
        cors(),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                let userForContext = null;
                const authHeader = req.headers.authorization || '';
                let token = null;

                if (authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }

                const decodedUserFromToken = verifyTokenForContext(token);

                if (decodedUserFromToken && decodedUserFromToken.id !== undefined) {
                    const userIdFromToken = parseInt(decodedUserFromToken.id, 10);
                    if (!isNaN(userIdFromToken)) {
                        try {
                            const dbUser = await db.Customer.findByPk(userIdFromToken, {
                                attributes: ['customer_id', 'username', 'isAdmin', 'customer_name', 'customer_email', 'virtual_balance']
                            });

                            if (dbUser) {
                                userForContext = {
                                    id: dbUser.customer_id,
                                    username: dbUser.username,
                                    isAdmin: dbUser.isAdmin === true,
                                    name: dbUser.customer_name,
                                    email: dbUser.customer_email,
                                    virtual_balance: dbUser.virtual_balance
                                };
                            }
                        } catch (dbError) {
                            logger.error(`[Apollo Context] DB Error:`, dbError);
                        }
                    }
                }

                let lang = 'vi';
                const clientLangHeader = req.headers['x-client-lang'];
                const acceptLangHeader = req.headers['accept-language'];
                if (clientLangHeader && ['vi', 'en'].includes(clientLangHeader)) {
                    lang = clientLangHeader;
                } else if (req.query.lang && ['vi', 'en'].includes(req.query.lang)) {
                    lang = req.query.lang;
                } else if (acceptLangHeader) {
                    const firstPreferredLang = acceptLangHeader.split(',')[0].toLowerCase();
                    if (firstPreferredLang.startsWith('en')) lang = 'en';
                }

                return {
                    user: userForContext,
                    db,
                    sequelize,
                    lang,
                    loaders: createLoaders(db),
                    redis: redisClient
                };
            },
        })
    );

    // Root routes và error handlers
    app.get('/', (req, res) => res.send(`API Server is running. GraphQL available at ${graphqlPath}`));
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Return cả app, httpServer và serverCleanup để sử dụng trong server.js
    return { 
        app, 
        httpServer, 
        serverCleanup,
        // Return thêm graphqlPath để sử dụng trong server.js
        graphqlPath 
    };
}

// Export createApp function
module.exports = createApp;