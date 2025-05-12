// models/ProductCollection.js
// Model cho bảng trung gian kết nối Product và Collection (Many-to-Many)
module.exports = (sequelize, DataTypes) => {
    const ProductCollection = sequelize.define('ProductCollection', {
        // Khóa ngoại trỏ tới Product, đồng thời là phần của khóa chính phức hợp
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, // Là phần của PK
            references: { model: 'Products', key: 'product_id' }, // Tham chiếu tới bảng Products
            onDelete: 'CASCADE', // Nếu Product bị xóa, xóa cả bản ghi này
            onUpdate: 'CASCADE'
        },
        // Khóa ngoại trỏ tới Collection, đồng thời là phần của khóa chính phức hợp
        collection_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, // Là phần của PK
            references: { model: 'Collections', key: 'collection_id' }, // Tham chiếu tới bảng Collections
            onDelete: 'CASCADE', // Nếu Collection bị xóa, xóa cả bản ghi này
            onUpdate: 'CASCADE'
        }
        // Có thể thêm các trường khác vào bảng trung gian nếu cần (vd: thứ tự hiển thị)
        // display_order: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        tableName: 'ProductCollections', // Tên bảng trong DB
        timestamps: false // Thường không cần timestamps cho bảng trung gian
    }); //

    // Bảng trung gian không cần định nghĩa associate phức tạp ở đây,
    // vì belongsToMany đã xử lý mối quan hệ.
    // Tuy nhiên, có thể thêm belongsTo nếu muốn truy vấn ngược từ ProductCollection
    // ProductCollection.associate = (models) => {
    //   ProductCollection.belongsTo(models.Product, { foreignKey: 'product_id' });
    //   ProductCollection.belongsTo(models.Collection, { foreignKey: 'collection_id' });
    // };

    return ProductCollection;
};