// models/Customer.js (ĐÃ CẬP NHẬT)
const bcrypt = require('bcryptjs'); // Import bcrypt để hash mật khẩu

module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
        customer_id: {
             type: DataTypes.INTEGER,
             autoIncrement: true,
             primaryKey: true
        },
        customer_name: {
             type: DataTypes.STRING(100),
             allowNull: false
        },
        username: {
             type: DataTypes.STRING(50),
             unique: true, // Username phải là duy nhất
             allowNull: true // Có thể null (cho phép đăng ký chỉ bằng email/sđt)
        },
        customer_email: { //
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true, // Email phải là duy nhất
            validate: { isEmail: true } // Sequelize tự động kiểm tra định dạng email
        },
        customer_tel: { // <<< SỬA ĐỔI
            type: DataTypes.STRING(20),
            allowNull: false, // Bắt buộc
            unique: true      // Duy nhất
        },
        customer_address: {
             type: DataTypes.STRING(200),
             allowNull: true
        },
        customer_password: { //
             type: DataTypes.STRING(255), // Tăng độ dài cho bcrypt hash
             allowNull: false // Mật khẩu là bắt buộc (trừ khi dùng OAuth hoàn toàn)
        },
        isAdmin: {
             type: DataTypes.BOOLEAN,
             defaultValue: false, // Mặc định là false
             allowNull: false
        },
        // --- CÁC TRƯỜNG MỚI ---
        virtual_balance: { // Số dư ảo
            type: DataTypes.DECIMAL(12, 2), // Kiểu số thập phân (ví dụ: 10 số trước dấu phẩy, 2 số sau)
            allowNull: false,
            defaultValue: 0.00, // Mặc định là 0
            validate: { min: 0 } // Validate không được âm
        },
        password_reset_token: { // Token để reset mật khẩu
            type: DataTypes.STRING(255), // Lưu token đã hash
            allowNull: true, // Có thể null
            defaultValue: null,
        },
        password_reset_expires: { // Thời gian hết hạn token reset
            type: DataTypes.DATE, // Kiểu ngày giờ
            allowNull: true,
            defaultValue: null,
        },
         // Thêm trường googleId nếu dùng Google OAuth
         googleId: {
             type: DataTypes.STRING,
             allowNull: true,
             unique: true
         }
    }, {
        tableName: 'Customers', // Tên bảng trong DB
        timestamps: false, // Không dùng createdAt, updatedAt tự động của Sequelize
        hooks: { // Giữ nguyên hook mã hóa mật khẩu
            // Hash mật khẩu trước khi tạo mới Customer
            beforeCreate: async (customer, options) => { //
                 if (customer.customer_password) { // Chỉ hash nếu có mật khẩu
                     const salt = await bcrypt.genSalt(10); // Tạo salt
                     customer.customer_password = await bcrypt.hash(customer.customer_password, salt); // Hash mật khẩu
                 }
             },
            // Hash mật khẩu trước khi cập nhật Customer (nếu mật khẩu thay đổi)
            beforeUpdate: async (customer, options) => { //
                 // Chỉ hash lại nếu trường password thực sự thay đổi
                 if (customer.changed('customer_password') && customer.customer_password) { //
                     const salt = await bcrypt.genSalt(10); //
                     customer.customer_password = await bcrypt.hash(customer.customer_password, salt); //
                 }
             }
        }
    }); //

    // Phương thức instance để so sánh mật khẩu (đã bỏ debug log)
    Customer.prototype.comparePassword = async function (candidatePassword) {
        if (!this.customer_password || !candidatePassword) { // Nếu không có hash hoặc không có password gửi lên
            return false; //
        }
        try {
            // So sánh password gửi lên với hash trong DB
            return await bcrypt.compare(candidatePassword, this.customer_password); //
        } catch (error) {
            console.error("Error comparing passwords:", error); //
            return false; // Trả về false nếu có lỗi
        }
    };

    // <<< THÊM Association >>>
    Customer.associate = (models) => {
        // Một Customer có thể có nhiều Sale (One-to-Many)
        Customer.hasMany(models.Sale, {
            foreignKey: 'customer_id', // Khóa ngoại trong bảng Sales
            as: 'sales' // Alias khi include Sale từ Customer
        }); //
    };

    return Customer;
};