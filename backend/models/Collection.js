// models/Collection.js
module.exports = (sequelize, DataTypes) => {
    const Collection = sequelize.define('Collection', {
        collection_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        collection_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        collection_description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        slug: { // Thêm trường slug
            type: DataTypes.STRING(110), // Độ dài slug (tên + buffer)
            allowNull: true, // Có thể null ban đầu nếu tự tạo từ hook
            unique: true
            // Add hook here to auto-generate slug from name if desired
        }
    }, {
        tableName: 'Collections',
        timestamps: false // Or true if you want createdAt/updatedAt
    }); //

    Collection.associate = (models) => {
        // Collection thuộc về nhiều Product (Many-to-Many) thông qua bảng ProductCollection
        Collection.belongsToMany(models.Product, {
            through: models.ProductCollection, // Tên model của bảng trung gian
            foreignKey: 'collection_id', // Khóa ngoại trong bảng trung gian trỏ về Collection
            otherKey: 'product_id',     // Khóa ngoại trong bảng trung gian trỏ về Product
            as: 'products'              // Bí danh khi include Product từ Collection
        }); //
    };

    return Collection;
};