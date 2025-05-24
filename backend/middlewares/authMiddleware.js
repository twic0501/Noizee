// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const Customer = db.Customer;
const logger = require('../utils/logger');

const TEMP_JWT_SECRET_FOR_MIDDLEWARE = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_at_least_32_characters_long';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!TEMP_JWT_SECRET_FOR_MIDDLEWARE || TEMP_JWT_SECRET_FOR_MIDDLEWARE.length < 32) {
                logger.error("FATAL ERROR: JWT_SECRET is not defined or is too short in authMiddleware.");
                // Do not proceed if JWT secret is insecure, even if token might be verifiable with a weak default
                return res.status(401).json({ message: 'Not authorized, server configuration error.' });
            }

            const decoded = jwt.verify(token, TEMP_JWT_SECRET_FOR_MIDDLEWARE);

            if (!decoded.user || decoded.user.id === undefined) { // Check for id specifically
                logger.warn(`Authentication failed: Invalid token payload structure. Decoded:`, decoded);
                return res.status(401).json({ message: 'Not authorized, invalid token payload' });
            }

            // Fetch the user from DB to get the most current data, including isAdmin
            // The Customer model's getter for `isAdmin` will ensure it's a boolean.
            const userFromDb = await Customer.findByPk(decoded.user.id, {
                attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
            });

            if (!userFromDb) {
                logger.warn(`Authentication failed: User ID ${decoded.user.id} from valid token not found in DB.`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            // Assign the Sequelize model instance to req.user
            // This allows access to model methods and getters like userFromDb.isAdmin
            req.user = userFromDb; 

            // Example logging (isAdmin will use the getter)
            // logger.debug(`User authenticated via token: ${req.user.customer_email} (ID: ${req.user.customer_id}, Admin: ${req.user.isAdmin})`);

            next();

        } catch (error) {
            logger.error('JWT verification failed in protect middleware:', { message: error.message, name: error.name });
            let message = 'Not authorized, token failed';
            if (error.name === 'JsonWebTokenError') {
                message = 'Not authorized, token invalid';
            } else if (error.name === 'TokenExpiredError') {
                message = 'Not authorized, token expired';
            }
            return res.status(401).json({ message });
        }
    }

    if (!token) { // If no token was found in the header
        // logger.warn('Authentication attempt failed: No token provided.');
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

const isAdmin = (req, res, next) => {
    // req.user is now a Sequelize instance, req.user.isAdmin will use the getter
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        logger.warn(`Authorization failed for isAdmin: User ID ${req.user?.customer_id || 'N/A'} (isAdmin: ${req.user?.isAdmin}) does not have admin privileges.`);
        res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
    }
};

module.exports = {
    protect,
    isAdmin
};
