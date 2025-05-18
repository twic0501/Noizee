// backend/models/SalesTotals.js
module.exports = (sequelize, DataTypes) => {
    const SalesTotals = sequelize.define('SalesTotals', {
        total_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // Mỗi đơn hàng chỉ có một record tổng tiền
            references: {
                model: 'Sales',
                key: 'sale_id'
            }
        },
        subtotal_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        discount_total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00
        }
    }, {
        tableName: 'SalesTotals',
        timestamps: false, // Theo schema SQL
        comment: 'Bảng lưu các giá trị tổng kết của đơn hàng'
    });

    SalesTotals.associate = (models) => {
        SalesTotals.belongsTo(models.Sale, {
            foreignKey: 'sale_id',
            as: 'sale',
            onDelete: 'CASCADE', // Nếu xóa Sale thì xóa luôn SalesTotals
            onUpdate: 'CASCADE'
        });
    };

    return SalesTotals;
};
