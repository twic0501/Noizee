// backend/models/Size.js
module.exports = (sequelize, DataTypes) => {
    const Size = sequelize.define('Size', {
        size_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        size_name: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
            comment: 'Tên kích cỡ (thường không cần dịch hoặc quản lý riêng)'
        }
    }, {
        tableName: 'Sizes',
        timestamps: false,
        comment: 'Bảng lưu các kích cỡ sản phẩm'
    });

    Size.associate = (models) => {
        Size.hasMany(models.Inventory, {
            foreignKey: 'size_id',
            as: 'inventoryItems'
        });
        // Nếu bạn có bảng ProductSizes cho quan hệ M-M trực tiếp với Product:
        // Size.belongsToMany(models.Product, {
        //   through: models.ProductSize,
        //   foreignKey: 'size_id',
        //   otherKey: 'product_id',
        //   as: 'products'
        // });
    };

    return Size;
};
