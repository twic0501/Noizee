// backend/models/SalesItems.js
module.exports = (sequelize, DataTypes) => {
    const SalesItems = sequelize.define('SalesItems', {
        sale_item_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Sales',
                key: 'sale_id'
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Cho phép NULL nếu sản phẩm gốc bị xóa
            references: {
                model: 'Products',
                key: 'product_id'
            }
        },
        size_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Sizes', key: 'size_id' }
        },
        color_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Colors', key: 'color_id' }
        },
        product_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1 // Số lượng phải lớn hơn 0
            }
        },
        price_at_sale: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá sản phẩm tại thời điểm bán'
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Số tiền giảm giá cho sản phẩm này'
        },
        product_name_at_sale: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Tên sản phẩm tại thời điểm bán (ngôn ngữ mặc định khi đặt hàng)'
        },
        product_sku_at_sale: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'SKU của biến thể nếu có'
        }
    }, {
        tableName: 'SalesItems',
        timestamps: false, // Theo schema SQL
        comment: 'Bảng lưu chi tiết các sản phẩm trong một đơn hàng'
    });

    SalesItems.associate = (models) => {
        SalesItems.belongsTo(models.Sale, {
            foreignKey: 'sale_id',
            as: 'sale',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        SalesItems.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product',
            onDelete: 'SET NULL', // Nếu sản phẩm bị xóa, giữ lại item nhưng product_id là NULL
            onUpdate: 'CASCADE'
        });
        SalesItems.belongsTo(models.Size, {
            foreignKey: 'size_id',
            as: 'size',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        SalesItems.belongsTo(models.Color, {
            foreignKey: 'color_id',
            as: 'color',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };

    return SalesItems;
};
