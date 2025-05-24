// backend/models/Customer.js
const bcrypt = require('bcryptjs');

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
             unique: true,
             allowNull: true
        },
        customer_email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        customer_tel: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        customer_address: {
             type: DataTypes.STRING(200),
             allowNull: true
        },
        customer_password: {
             type: DataTypes.STRING(255),
             allowNull: true // Cho phép null nếu đăng nhập qua Google và chưa set password
        },
        isAdmin: {
             type: DataTypes.BOOLEAN, // Hoặc DataTypes.TINYINT(1)
             defaultValue: false,
             allowNull: false,
             get() { // Thêm getter
                const rawValue = this.getDataValue('isAdmin');
                return rawValue === true || rawValue === 1;
             }
        },
        virtual_balance: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        password_reset_token: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        password_reset_expires: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
         googleId: {
             type: DataTypes.STRING,
             allowNull: true,
             unique: true
         }
    }, {
        tableName: 'Customers',
        timestamps: true, // Nên có createdAt và updatedAt
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (customer) => {
                 if (customer.customer_password) {
                     const salt = await bcrypt.genSalt(10);
                     customer.customer_password = await bcrypt.hash(customer.customer_password, salt);
                 }
             },
            beforeUpdate: async (customer) => {
                 if (customer.changed('customer_password') && customer.customer_password) {
                     const salt = await bcrypt.genSalt(10);
                     customer.customer_password = await bcrypt.hash(customer.customer_password, salt);
                 }
             }
        }
    });

    Customer.prototype.comparePassword = async function (candidatePassword) {
        if (!this.customer_password || !candidatePassword) {
            return false;
        }
        try {
            return await bcrypt.compare(candidatePassword, this.customer_password);
        } catch (error) {
            logger.error("Error comparing passwords:", error); // Sử dụng logger
            return false;
        }
    };

    Customer.associate = (models) => {
        Customer.hasMany(models.Sale, {
            foreignKey: 'customer_id',
            as: 'sales'
        });
        Customer.hasMany(models.BlogPost, { // Thêm association này nếu chưa có
            foreignKey: 'user_id',
            as: 'blogPosts'
        });
        Customer.hasMany(models.BlogComment, { // Thêm association này nếu chưa có
            foreignKey: 'user_id',
            as: 'blogComments'
        });
    };

    return Customer;
};
