// models/Inventory.js
module.exports = (sequelize, DataTypes) => {
    const Inventory = sequelize.define('Inventory', {
        inventory_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Quan trọng: Khai báo khóa ngoại
                model: 'Products', // Tên bảng Products
                key: 'product_id'
            }
        },
        size_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Cho phép NULL nếu sản phẩm không có size
            references: {
                model: 'Sizes', // Tên bảng Sizes
                key: 'size_id'
            }
        },
        color_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Cho phép NULL nếu sản phẩm không có màu
            references: {
                model: 'Colors', // Tên bảng Colors
                key: 'color_id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 } // Số lượng không âm
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true // SKU là duy nhất nếu có
        }
    }, {
        tableName: 'Inventory',
        timestamps: false, // Không dùng createdAt/updatedAt
        indexes: [ // Định nghĩa các index như trong SQL của bạn
            {
                unique: true,
                fields: ['product_id', 'size_id', 'color_id'] // UNIQUE KEY unique_variant
            }
        ]
    });

    Inventory.associate = (models) => {
        // Một Inventory entry thuộc về một Product
        Inventory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
        // Một Inventory entry có thể thuộc về một Size (tùy chọn)
        Inventory.belongsTo(models.Size, { foreignKey: 'size_id', as: 'size' });
        // Một Inventory entry có thể thuộc về một Color (tùy chọn)
        Inventory.belongsTo(models.Color, { foreignKey: 'color_id', as: 'color' });
    };

    return Inventory;
};