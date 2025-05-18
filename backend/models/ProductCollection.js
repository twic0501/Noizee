// backend/models/ProductCollection.js
module.exports = (sequelize, DataTypes) => {
    const ProductCollection = sequelize.define('ProductCollection', {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Products',
                key: 'product_id'
            }
        },
        collection_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Collections',
                key: 'collection_id'
            }
        }
    }, {
        tableName: 'ProductCollections',
        timestamps: false, // Bảng nối thường không cần timestamps
        comment: 'Bảng nối Sản phẩm và Bộ sưu tập (Many-to-Many)'
    });

    // Bảng nối thường không cần định nghĩa 'associate' ở đây
    // vì các quan hệ belongsToMany đã xử lý nó.

    return ProductCollection;
};
