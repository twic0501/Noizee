// backend/controllers/authController.js
const { db } = require('../config/db');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');
// const sendEmail = require('../utils/sendEmail'); // Uncomment if you implement email sending

const Customer = db.Customer;

const TEMP_JWT_SECRET_FOR_CONTROLLER = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_at_least_32_characters_long';

// Helper Function: Generate JWT
const generateToken = (customerInstance) => {
    // customerInstance.isAdmin sẽ tự động gọi getter trong model Customer.js
    const isAdminStatus = customerInstance.isAdmin; // This will be true or false due to the getter

    if (typeof isAdminStatus !== 'boolean') {
        logger.error('[generateToken - authController] isAdmin field is not a boolean after fetching from model:', { customerId: customerInstance.customer_id, isAdminValue: isAdminStatus, isAdminType: typeof isAdminStatus });
        // Fallback or throw error, though getter should prevent this
        // For safety, explicitly cast common truthy/falsy db values if getter wasn't there
        // isAdminStatus = !!(isAdminStatus === 1 || String(isAdminStatus).toLowerCase() === 'true');
    }

    const payload = {
        user: {
            id: customerInstance.customer_id,
            username: customerInstance.username,
            isAdmin: isAdminStatus // Đảm bảo đây là boolean
        }
    };

    const secret = TEMP_JWT_SECRET_FOR_CONTROLLER;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    if (!secret || secret.length < 32) {
        logger.error("FATAL ERROR: JWT_SECRET is not defined or is too short for token generation in authController.");
        throw new Error("JWT_SECRET is not configured securely on the server.");
    }
    return jwt.sign(payload, secret, { expiresIn });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
const registerCustomer = async (req, res, next) => {
    const { customer_name, username, customer_email, customer_password, customer_tel, customer_address } = req.body;

    if (!customer_name || !customer_email || !customer_password || !customer_tel) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (tên, email, mật khẩu, SĐT).' });
    }
    if (customer_password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    try {
        const existingCustomer = await Customer.findOne({
            where: {
                [Op.or]: [
                    { customer_email: customer_email },
                    { customer_tel: customer_tel }
                ]
            }
        });

        if (existingCustomer) {
            let message = existingCustomer.customer_email === customer_email ? 'Email này đã được sử dụng.' : 'Số điện thoại này đã được sử dụng.';
            logger.warn(`Registration failed: Duplicate entry - ${message}`);
            return res.status(400).json({ message: message + ' Nếu đây là tài khoản của bạn, vui lòng sử dụng chức năng Quên mật khẩu.' });
        }

        if (username) {
            const usernameExists = await Customer.findOne({ where: { username: username } });
            if (usernameExists) {
                logger.warn(`Registration failed: Duplicate username - ${username}`);
                return res.status(400).json({ message: 'Username này đã tồn tại.' });
            }
        }

        const customer = await Customer.create({
            customer_name,
            username: username || null,
            customer_email,
            customer_password, // Hook 'beforeCreate' sẽ hash
            customer_tel,
            customer_address: customer_address || null,
            virtual_balance: 2000000,
            isAdmin: false
        });

        logger.info(`New customer registered: ${customer.customer_email} (ID: ${customer.customer_id}) with initial virtual balance.`);
        const token = generateToken(customer);
        res.status(201).json({
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            username: customer.username,
            customer_email: customer.customer_email,
            isAdmin: customer.isAdmin, // Sẽ là boolean do getter
            token: token,
        });

    } catch (error) {
        logger.error('Error registering customer:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' });
        }
        next(error);
    }
};

// @desc    Authenticate customer & get token (Login bằng Email hoặc Username)
// @route   POST /api/auth/login
const loginCustomer = async (req, res, next) => {
    const { identifier, customer_password } = req.body;

    if (!identifier || !customer_password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email/username và mật khẩu.' });
    }

    try {
        const customer = await Customer.findOne({
            where: {
                [Op.or]: [
                    { customer_email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!customer || !(await customer.comparePassword(customer_password))) {
            logger.warn(`Login attempt failed: Invalid credentials for identifier - ${identifier}`);
            return res.status(401).json({ message: 'Email/Username hoặc mật khẩu không chính xác.' });
        }

        logger.info(`Customer logged in: ${customer.customer_email} (ID: ${customer.customer_id})`);
        const token = generateToken(customer);
        res.json({
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            username: customer.username,
            customer_email: customer.customer_email,
            isAdmin: customer.isAdmin, // Sẽ là boolean do getter
            token: token,
        });

    } catch (error) {
        logger.error('Error logging in customer:', error);
        next(error);
    }
};

// @desc    Authenticate ADMIN & get token (Login bằng Username)
// @route   POST /api/auth/admin/login
const loginAdmin = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp username và mật khẩu.' });
    }

    try {
        const adminUser = await Customer.findOne({ where: { username: username } });

        if (!adminUser || !(await adminUser.comparePassword(password))) {
            logger.warn(`Admin login attempt failed: Invalid credentials for username - ${username}`);
            return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ.' });
        }

        if (adminUser.isAdmin !== true) { // Getter đảm bảo adminUser.isAdmin là boolean
            logger.warn(`Admin login attempt failed: User ${username} is not an admin.`);
            return res.status(403).json({ message: 'Truy cập bị từ chối. Tài khoản không có quyền Admin.' });
        }

        logger.info(`Admin logged in: ${adminUser.username} (ID: ${adminUser.customer_id})`);
        const token = generateToken(adminUser);
        res.json({
            customer_id: adminUser.customer_id,
            customer_name: adminUser.customer_name,
            username: adminUser.username,
            customer_email: adminUser.customer_email,
            isAdmin: adminUser.isAdmin, // Sẽ là true
            token: token,
        });

    } catch (error) {
        logger.error('Error logging in admin:', error);
        next(error);
    }
};


// @desc    Get current logged-in customer profile
// @route   GET /api/auth/profile
const getCustomerProfile = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Không được phép, vui lòng đăng nhập lại.' });
    }

    try {
        // req.user đã được gắn bởi middleware `protect`, và `isAdmin` trong đó đã là boolean
        const customer = await Customer.findByPk(req.user.id, {
            attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
        });

        if (customer) {
            // customer.isAdmin sẽ sử dụng getter
            res.json({
                customer_id: customer.customer_id,
                customer_name: customer.customer_name,
                username: customer.username,
                customer_email: customer.customer_email,
                customer_tel: customer.customer_tel,
                customer_address: customer.customer_address,
                isAdmin: customer.isAdmin,
                virtual_balance: customer.virtual_balance
            });
        } else {
            logger.warn(`Profile fetch failed: Customer with ID ${req.user.id} not found in DB.`);
            res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
        }

    } catch (error) {
        logger.error(`Error fetching profile for user ID ${req.user.id}:`, error);
        next(error);
    }
};

// @desc    Request password reset (send email with token)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
    }
    try {
        const customer = await Customer.findOne({ where: { customer_email: email } });
        if (!customer) {
            logger.warn(`Password reset request for non-existent email: ${email}`);
            return res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        customer.password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        customer.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await customer.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const messageBody = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
Vui lòng truy cập đường dẫn sau hoặc bỏ qua nếu bạn không yêu cầu:\n\n${resetUrl}\n\nLink này sẽ hết hạn sau 10 phút.`;

        // Placeholder for email sending
        // try {
        //     await sendEmail({ email: customer.customer_email, subject: 'Yêu cầu đặt lại mật khẩu', message: messageBody });
        //     logger.info(`Password reset email supposedly sent to ${customer.customer_email}.`);
        // } catch (emailError) {
        //     logger.error(`Error sending password reset email to ${email}:`, emailError);
        //     customer.password_reset_token = null;
        //     customer.password_reset_expires = null;
        //     await customer.save();
        //     return next(new Error('Lỗi xảy ra khi gửi email. Vui lòng thử lại sau.'));
        // }
        logger.info(`Simulating password reset email to ${customer.customer_email}. Token: ${resetToken} (for testing)`); // Remove token in production logs

        res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' });

    } catch (error) {
        logger.error('Error in forgotPassword:', error);
        next(error);
    }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới (ít nhất 6 ký tự).' });
    }
    if (!token) {
        return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc bị thiếu.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const customer = await Customer.findOne({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { [Op.gt]: Date.now() }
            }
        });

        if (!customer) {
            logger.warn(`Password reset attempt with invalid or expired token.`);
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        customer.customer_password = password; // Hook will hash
        customer.password_reset_token = null;
        customer.password_reset_expires = null;
        await customer.save();

        const loginToken = generateToken(customer); // customer.isAdmin is now boolean
        logger.info(`Password reset successfully for user ${customer.customer_email}`);

        res.status(200).json({
            message: 'Đặt lại mật khẩu thành công.',
            token: loginToken,
            // customer_id: customer.customer_id, // Optionally return some user info
            // isAdmin: customer.isAdmin
        });

    } catch (error) {
        logger.error('Error in resetPassword:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return res.status(400).json({ message: messages || 'Mật khẩu mới không hợp lệ.' });
        }
        next(error);
    }
};

module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    loginAdmin,
    forgotPassword,
    resetPassword
};
