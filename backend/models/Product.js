// models/Product.js
module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        product_description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        product_price: {
            type: DataTypes.DECIMAL(17, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: { isDecimal: true, min: 0 }
        },
        // XÓA HOÀN TOÀN KHỐI product_stock TỪ ĐÂY
        // product_stock: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     defaultValue: 0,
        //     validate: { isInt: true, min: 0 }
        // },
        imageUrl: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        secondaryImageUrl: { // Bạn có thể thêm trường này vào model nếu dùng
            type: DataTypes.STRING(255),
            allowNull: true
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Categories',
                key: 'category_id'
            }
        },
        is_active: { // Bạn nên thêm trường này vào model
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        is_new_arrival: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: 'Products',
        timestamps: false
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });
        Product.belongsToMany(models.Size, {
            through: models.ProductSize,
            foreignKey: 'product_id',
            otherKey: 'size_id',
            as: 'sizes'
        });
        Product.hasMany(models.SalesItems, {
            foreignKey: 'product_id',
            as: 'saleItems'
        });
        Product.belongsToMany(models.Color, {
            through: models.ProductColor,
            foreignKey: 'product_id',
            otherKey: 'color_id',
            as: 'colors'
        });
        Product.belongsToMany(models.Collection, {
            through: models.ProductCollection,
            foreignKey: 'product_id',
            otherKey: 'collection_id',
            as: 'collections'
        });

        // >>> THÊM ASSOCIATION VỚI INVENTORY <<<
        Product.hasMany(models.Inventory, { // Một sản phẩm có nhiều dòng tồn kho (cho các variant)
            foreignKey: 'product_id',
            as: 'inventory' // Alias để include
        });
        // >>> KẾT THÚC THÊM ASSOCIATION <<<
    };

    return Product;
};