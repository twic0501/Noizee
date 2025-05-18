// backend/models/Product.js
module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_name_vi: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Tên sản phẩm (Tiếng Việt)'
        },
        product_name_en: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Tên sản phẩm (Tiếng Anh)'
        },
        product_description_vi: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả sản phẩm (Tiếng Việt)'
        },
        product_description_en: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả sản phẩm (Tiếng Anh)'
        },
        product_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Categories', // Tên bảng
                key: 'category_id'
            }
        },
        is_new_arrival: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Cờ để ẩn/hiện sản phẩm thay vì xóa'
        }
    }, {
        tableName: 'Products',
        timestamps: false,
        comment: 'Bảng lưu thông tin chính của sản phẩm (Đa ngôn ngữ)'
    });

    Product.associate = (models) => {
        // Product -> Category (One-to-Many)
        Product.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category' // Alias for this association
        });

        // Product -> ProductImage (One-to-Many)
        Product.hasMany(models.ProductImage, {
            foreignKey: 'product_id',
            as: 'images', // Alias for this association
            onDelete: 'CASCADE', // Optional: if deleting a product also deletes its images
            hooks: true         // Optional: to trigger hooks on associated models
        });

        // Product -> Inventory (One-to-Many)
        Product.hasMany(models.Inventory, {
            foreignKey: 'product_id',
            as: 'inventoryItems', // Using 'inventoryItems' as a common alias. You can also use 'inventory'.
                                 // This alias MUST be consistent with what you use in resolvers.
            onDelete: 'CASCADE',
            hooks: true
        });

        // Product -> Collection (Many-to-Many through ProductCollection)
        Product.belongsToMany(models.Collection, {
            through: models.ProductCollection, // Using the join table model
            foreignKey: 'product_id',
            otherKey: 'collection_id',
            as: 'collections' // Alias for this association
        });
    };

    return Product;
};
