// controllers/authController.js (Phiên bản hoàn chỉnh đã sửa đổi)
// Import các module cần thiết
const { db } = require('../config/db'); // Import db object từ config
const { Op } = require('sequelize'); // Import Operator của Sequelize
const jwt = require('jsonwebtoken'); // Để tạo token
const bcrypt = require('bcryptjs'); // Để so sánh mật khẩu
const crypto = require('crypto'); // Dùng để tạo token reset mật khẩu
const logger = require('../utils/logger'); // Import logger
// const sendEmail = require('../utils/sendEmail'); // Giả sử bạn có utility gửi email

// Lấy model Customer từ db object
const Customer = db.Customer; //

// --- Helper Function: Generate JWT ---
// (Đã sửa để nhận cả object customer và thêm thông tin vào payload)
const generateToken = (customer) => {
    if (!customer || typeof customer.isAdmin === 'undefined') {
        logger.error('[generateToken] Invalid customer object or isAdmin field missing:', customer);
        throw new Error("Cannot generate token for invalid user data.");
    }
    // Payload chứa thông tin cơ bản và quyền của user
    const payload = {
        user: {
            id: customer.customer_id, // ID của user
            username: customer.username, // Username (có thể null)
            isAdmin: customer.isAdmin // <<< Thêm isAdmin vào payload
        }
    };

    // Lấy secret và expiresIn từ biến môi trường hoặc dùng giá trị mặc định an toàn
    const secret = process.env.JWT_SECRET; //
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h'; //

    if (!secret) {
        logger.error("FATAL ERROR: JWT_SECRET is not defined for token generation.");
        // Trong môi trường production, có thể không nên throw Error mà chỉ log và trả về lỗi cho client
        throw new Error("JWT_SECRET is not configured on the server.");
    }
    return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
};

// --- Controller Functions ---

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerCustomer = async (req, res, next) => {
    // Lấy thông tin từ request body
    const { customer_name, username, customer_email, customer_password, customer_tel, customer_address } = req.body; //

    // --- Validation cơ bản ---
    // Kiểm tra các trường bắt buộc
    if (!customer_name || !customer_email || !customer_password || !customer_tel) { //
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (tên, email, mật khẩu, SĐT).' }); //
    }
    // Thêm các validation khác nếu cần (độ dài mật khẩu, định dạng email/SĐT...)
    // Ví dụ: if (customer_password.length < 6) { ... }

    try {
        // 1. KIỂM TRA TRÙNG LẶP EMAIL VÀ SĐT
        // Tìm xem có customer nào đã tồn tại với email hoặc SĐT này chưa
        const existingCustomer = await Customer.findOne({
            where: {
                [Op.or]: [ // Điều kiện OR
                    { customer_email: customer_email },
                    { customer_tel: customer_tel }
                ]
            }
        });

        // Nếu tìm thấy customer trùng
        if (existingCustomer) { //
            let message = ''; //
            if (existingCustomer.customer_email === customer_email) { //
                message = 'Email này đã được sử dụng.'; //
            } else { // Nếu không phải email thì là SĐT
                message = 'Số điện thoại này đã được sử dụng.'; //
            }
            logger.warn(`Registration failed: Duplicate entry - ${message}`); //
            // Trả về lỗi 400 Bad Request
            return res.status(400).json({ message: message + ' Nếu đây là tài khoản của bạn, vui lòng sử dụng chức năng Quên mật khẩu.' }); //
        }

        // Kiểm tra trùng lặp username nếu có nhập
        if (username) { //
            const usernameExists = await Customer.findOne({ where: { username: username } }); //
            if (usernameExists) { //
                logger.warn(`Registration failed: Duplicate username - ${username}`); //
                return res.status(400).json({ message: 'Username này đã tồn tại.' }); //
            }
        }

        // 2. TẠO CUSTOMER MỚI VỚI SỐ DƯ ẢO BAN ĐẦU
        // Sử dụng Customer.create để tạo bản ghi mới trong DB
        const customer = await Customer.create({
            customer_name,
            username: username || null, // Cho phép username là null nếu không nhập
            customer_email,
            customer_password, // Model hook 'beforeCreate' sẽ tự động hash mật khẩu này
            customer_tel,
            customer_address: customer_address || null, // Địa chỉ có thể null
            virtual_balance: 2000000, // <<< Gán 2 triệu số dư ảo
            isAdmin: false // Mặc định không phải admin
        }); //

        // 3. Trả về thông tin và token
        // Ghi log thành công
        logger.info(`New customer registered: ${customer.customer_email} (ID: ${customer.customer_id}) with initial virtual balance.`); //
        // Tạo JWT token cho user mới
        const token = generateToken(customer); //
        // Trả về response 201 Created với thông tin user và token
        res.status(201).json({
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            username: customer.username,
            customer_email: customer.customer_email,
            isAdmin: customer.isAdmin, // Trả về quyền admin
            token: token, // Token để client lưu lại
        }); //

    } catch (error) {
        // Xử lý lỗi chung hoặc lỗi từ Sequelize
        logger.error('Error registering customer:', error); //

        // Xử lý lỗi validation/unique từ Sequelize
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') { //
            // Lấy message lỗi cụ thể từ Sequelize
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message; //
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' }); //
        }

        // Chuyển lỗi khác về error handler chung (đã định nghĩa trong middleware)
        next(error); //
    }
};

// @desc    Authenticate customer & get token (Login bằng Email hoặc Username)
// @route   POST /api/auth/login
// @access  Public
const loginCustomer = async (req, res, next) => {
    // Nhận 'identifier' (có thể là email hoặc username) và password từ body
    const { identifier, customer_password } = req.body; //

    // Kiểm tra xem có đủ thông tin không
    if (!identifier || !customer_password) { //
        return res.status(400).json({ message: 'Vui lòng cung cấp email/username và mật khẩu.' }); //
    }

    try {
        // 1. TÌM USER BẰNG EMAIL HOẶC USERNAME
        // Sử dụng Op.or để tìm bằng một trong hai trường
        const customer = await Customer.findOne({
            where: {
                [Op.or]: [
                    { customer_email: identifier }, // Tìm bằng email
                    { username: identifier }       // Hoặc tìm bằng username
                ]
            }
        });

        // Nếu không tìm thấy user
        if (!customer) { //
            logger.warn(`Login attempt failed: Identifier not found - ${identifier}`); //
            // Trả về lỗi 401 Unauthorized (Không nên ghi rõ là sai email hay password)
            return res.status(401).json({ message: 'Email/Username hoặc mật khẩu không chính xác.' }); //
        }

        // 2. SO SÁNH MẬT KHẨU (Sử dụng phương thức comparePassword từ model)
        // Hàm này đã được định nghĩa trong model Customer để so sánh hash
        const isMatch = await customer.comparePassword(customer_password); //

        // Nếu mật khẩu không khớp
        if (!isMatch) { //
            logger.warn(`Login attempt failed: Invalid password for identifier - ${identifier}`); //
            // Trả về lỗi 401 Unauthorized
            return res.status(401).json({ message: 'Email/Username hoặc mật khẩu không chính xác.' }); //
        }

        // 3. Đăng nhập thành công, tạo token
        logger.info(`Customer logged in: ${customer.customer_email} (ID: ${customer.customer_id})`); //
        // Tạo JWT token
        const token = generateToken(customer); //
        // Trả về thông tin user và token
        res.json({
            customer_id: customer.customer_id,
            customer_name: customer.customer_name,
            username: customer.username,
            customer_email: customer.customer_email,
            isAdmin: customer.isAdmin, // Trả về quyền admin
            token: token,
        }); //

    } catch (error) {
        // Xử lý lỗi
        logger.error('Error logging in customer:', error); //
        next(error); // Chuyển lỗi về error handler
    }
};

// @desc    Authenticate ADMIN & get token (Login bằng Username)
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
    const { username, password } = req.body; // Admin dùng username và password

    // Kiểm tra input
    if (!username || !password) { //
        return res.status(400).json({ message: 'Vui lòng cung cấp username và mật khẩu.' }); //
    }

    try {
        // 1. TÌM USER BẰNG USERNAME
        const adminUser = await Customer.findOne({ where: { username: username } }); //

        // Nếu không tìm thấy username
        if (!adminUser) { //
            logger.warn(`Admin login attempt failed: Username not found - ${username}`); //
            return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ.' }); //
        }

        // 2. SO SÁNH MẬT KHẨU
        const isMatch = await adminUser.comparePassword(password); //

        // Nếu mật khẩu sai
        if (!isMatch) { //
            logger.warn(`Admin login attempt failed: Invalid password for username - ${username}`); //
            return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ.' }); //
        }

        // 3. KIỂM TRA QUYỀN ADMIN
        // Đảm bảo trường isAdmin là true
        if (adminUser.isAdmin !== true) { //
            logger.warn(`Admin login attempt failed: User ${username} is not an admin.`); //
            return res.status(403).json({ message: 'Truy cập bị từ chối. Tài khoản không có quyền Admin.' }); // Forbidden
        }

        // 4. Đăng nhập Admin thành công, tạo token
        logger.info(`Admin logged in: ${adminUser.username} (ID: ${adminUser.customer_id})`); //
        // Tạo token với thông tin admin
        const token = generateToken(adminUser); //
        // Trả về thông tin admin và token
        res.json({
            customer_id: adminUser.customer_id,
            customer_name: adminUser.customer_name,
            username: adminUser.username,
            customer_email: adminUser.customer_email,
            isAdmin: adminUser.isAdmin, // = true
            token: token,
        }); //

    } catch (error) {
        // Xử lý lỗi
        logger.error('Error logging in admin:', error); //
        next(error); // Chuyển về error handler
    }
};


// @desc    Get current logged-in customer profile
// @route   GET /api/auth/profile
// @access  Private (requires token via 'protect' middleware)
const getCustomerProfile = async (req, res, next) => {
    // Middleware 'protect' đã xác thực token và gắn req.user (chứa id, username, isAdmin)
    if (!req.user || !req.user.id) { //
        // Trường hợp này ít xảy ra nếu protect hoạt động đúng
        return res.status(401).json({ message: 'Không được phép, vui lòng đăng nhập lại.' }); //
    }

    try {
        // Lấy thông tin MỚI NHẤT từ DB dựa vào ID từ token (req.user.id)
        const customer = await Customer.findByPk(req.user.id, {
            attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] } // Loại bỏ các trường nhạy cảm
        });

        // Nếu tìm thấy user trong DB
        if (customer) { //
            // Trả về thông tin user (trừ các trường nhạy cảm)
            res.json({
                customer_id: customer.customer_id,
                customer_name: customer.customer_name,
                username: customer.username,
                customer_email: customer.customer_email,
                customer_tel: customer.customer_tel,
                customer_address: customer.customer_address,
                isAdmin: customer.isAdmin,
                virtual_balance: customer.virtual_balance // Có thể trả về số dư ảo nếu cần
            }); //
        } else {
            // Nếu không tìm thấy user trong DB (dù token hợp lệ - user có thể đã bị xóa)
            logger.warn(`Profile fetch failed: Customer with ID ${req.user.id} not found in DB.`); //
            res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' }); //
        }

    } catch (error) {
        // Xử lý lỗi
        logger.error(`Error fetching profile for user ID ${req.user.id}:`, error); //
        next(error); // Chuyển về error handler
    }
};

// --- Chức năng Quên Mật khẩu ---

// @desc    Request password reset (send email with token)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    const { email } = req.body; // Lấy email từ request body

    // Kiểm tra email có được cung cấp không
    if (!email) { //
        return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' }); //
    }

    try {
        // Tìm customer bằng email
        const customer = await Customer.findOne({ where: { customer_email: email } }); //

        // Nếu không tìm thấy customer
        if (!customer) { //
            // Quan trọng: Không thông báo email không tồn tại để tránh dò email
            logger.warn(`Password reset request for non-existent email: ${email}`); //
            // Luôn trả về thông báo thành công chung chung
            return res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' }); //
        }

        // Nếu tìm thấy customer:
        // 1. Tạo Reset Token (raw và hashed)
        const resetToken = crypto.randomBytes(32).toString('hex'); // Token gốc để gửi đi
        const hashedToken = crypto
            .createHash('sha256') // Dùng SHA256
            .update(resetToken)  // Hash token gốc
            .digest('hex');      // Lấy chuỗi hex

        // 2. Đặt thời gian hết hạn (ví dụ: 10 phút)
        const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // 3. Cập nhật vào DB
        customer.password_reset_token = hashedToken; // Lưu token đã hash
        customer.password_reset_expires = resetExpires; // Lưu thời gian hết hạn
        await customer.save(); // Lưu thay đổi vào DB

        // 4. Gửi Email (Cần triển khai hàm sendEmail)
        // Tạo URL reset trên frontend
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // URL trên frontend của bạn
        // Nội dung email
        const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
Vui lòng truy cập đường dẫn sau hoặc bỏ qua nếu bạn không yêu cầu:\n\n${resetUrl}\n\nLink này sẽ hết hạn sau 10 phút.`; //

        // Thử gửi email (đoạn code này đang được comment, cần un-comment và triển khai sendEmail)
        try {
            // await sendEmail({
            //     email: customer.customer_email,
            //     subject: 'Yêu cầu đặt lại mật khẩu',
            //     message: message
            // });

            // Log tạm (xóa khi production)
            logger.info(`Password reset email supposedly sent to ${customer.customer_email}. Token: ${resetToken}`); // Log token gốc để test (xóa khi production)

            // Trả về thông báo thành công chung chung
            res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' }); //

        } catch (emailError) {
            // Nếu gửi email thất bại
            logger.error(`Error sending password reset email to ${email}:`, emailError); //
            // Quan trọng: Xóa token đã lưu nếu gửi mail thất bại để user có thể thử lại
            customer.password_reset_token = null; //
            customer.password_reset_expires = null; //
            await customer.save(); //

            // Không nên trả về lỗi chi tiết cho client, trả về lỗi chung
            // Tạo một lỗi mới và chuyển đến error handler
            return next(new Error('Lỗi xảy ra khi gửi email. Vui lòng thử lại sau.')); //
        }

    } catch (error) {
        // Xử lý lỗi chung
        logger.error('Error in forgotPassword:', error); //
        next(error); // Chuyển về error handler
    }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token  (Dùng PUT thay vì POST)
// @access  Public
const resetPassword = async (req, res, next) => {
    const { token } = req.params; // Lấy token từ URL param
    const { password } = req.body; // Lấy mật khẩu mới từ body

    // Kiểm tra mật khẩu mới
    if (!password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới.' }); //
    }

    // Kiểm tra token
    if (!token) {
        return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc bị thiếu.' }); //
    }

    try {
        // 1. Hash token nhận được từ URL để so sánh với token đã hash trong DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex'); //

        // 2. Tìm user bằng hashed token VÀ token chưa hết hạn
        const customer = await Customer.findOne({
            where: {
                password_reset_token: hashedToken, // Tìm bằng token đã hash
                password_reset_expires: { [Op.gt]: Date.now() } // Kiểm tra thời gian hết hạn > thời gian hiện tại
            }
        });

        // Nếu không tìm thấy user hợp lệ (token sai hoặc hết hạn)
        if (!customer) { //
            logger.warn(`Password reset attempt with invalid or expired token.`); //
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' }); //
        }

        // 3. Đặt lại mật khẩu mới (hook beforeUpdate trong model Customer sẽ tự động hash)
        customer.customer_password = password; //

        // 4. Xóa thông tin reset token để không dùng lại được nữa
        customer.password_reset_token = null;
        customer.password_reset_expires = null;
        await customer.save(); // Lưu các thay đổi (mật khẩu mới đã hash, xóa token)

        // 5. (Tùy chọn) Tạo token đăng nhập mới và trả về để user đăng nhập luôn
        const loginToken = generateToken(customer); //
        logger.info(`Password reset successfully for user ${customer.customer_email}`); //

        // Trả về thành công và token đăng nhập mới
        res.status(200).json({
            message: 'Đặt lại mật khẩu thành công.',
            token: loginToken // Trả về token để tự động đăng nhập
        }); //

    } catch (error) {
        logger.error('Error in resetPassword:', error); //

        // Xử lý lỗi validation mật khẩu mới nếu có (ví dụ: mật khẩu quá yếu theo rules trong model)
        if (error.name === 'SequelizeValidationError') { //
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message; //
            return res.status(400).json({ message: messages || 'Mật khẩu mới không hợp lệ.' }); //
        }

        next(error); // Chuyển lỗi khác về error handler
    }
};

// --- Exports ---
module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    loginAdmin, // Thêm export cho loginAdmin
    forgotPassword, // Thêm export
    resetPassword   // Thêm export
}; //