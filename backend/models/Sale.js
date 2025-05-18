// backend/models/Sale.js
module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define('Sale', {
        sale_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        sale_status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Pending',
            comment: 'Trạng thái đơn hàng (Pending, Processing, Shipped, Delivered, Cancelled, Failed)'
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Cho phép NULL nếu khách vãng lai
            references: {
                model: 'Customers',
                key: 'customer_id'
            }
        },
        shipping_name: DataTypes.STRING(100),
        shipping_phone: DataTypes.STRING(20),
        shipping_address: DataTypes.STRING(255),
        shipping_notes: DataTypes.TEXT,
        payment_method: {
            type: DataTypes.STRING(50),
            defaultValue: 'COD'
        }
    }, {
        tableName: 'Sales',
        timestamps: false, // Theo schema SQL
        comment: 'Bảng lưu thông tin chính của đơn hàng'
    });

    Sale.associate = (models) => {
        Sale.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer',
            onDelete: 'RESTRICT', // Quan trọng: để không xóa customer nếu có sale
            onUpdate: 'CASCADE'
        });
        Sale.hasMany(models.SalesHistory, {
            foreignKey: 'sale_id',
            as: 'history',
            onDelete: 'CASCADE'
        });
        Sale.hasMany(models.SalesItems, {
            foreignKey: 'sale_id',
            as: 'items',
            onDelete: 'CASCADE'
        });
        Sale.hasOne(models.SalesTotals, { // Quan hệ 1-1
            foreignKey: 'sale_id',
            as: 'totals',
            onDelete: 'CASCADE'
        });
    };

    return Sale;
};
