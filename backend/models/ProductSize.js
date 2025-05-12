// models/ProductSize.js
// Model cho bảng trung gian Product - Size (Many-to-Many)
module.exports = (sequelize, DataTypes) => {
    const ProductSize = sequelize.define('ProductSize', {
        // Khóa ngoại tham chiếu đến bảng Products
        // Đồng thời là một phần của Primary Key phức hợp
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, // Đánh dấu là phần của Primary Key
            references: {
                model: 'Products', // Tên bảng hoặc Model name của Product
                key: 'product_id'   // Khóa chính của bảng Products
            },
            onDelete: 'CASCADE', // Nếu Product bị xóa, xóa luôn bản ghi liên kết này
            onUpdate: 'CASCADE'  // Nếu product_id thay đổi, cập nhật ở đây
        },
        // Khóa ngoại tham chiếu đến bảng Sizes
        // Đồng thời là một phần của Primary Key phức hợp
        size_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, // Đánh dấu là phần của Primary Key
            references: {
                model: 'Sizes', // Tên bảng hoặc Model name của Size
                key: 'size_id'   // Khóa chính của bảng Sizes
            },
            onDelete: 'CASCADE', // Nếu Size bị xóa, xóa luôn bản ghi liên kết này
            onUpdate: 'CASCADE'
        }
        // Có thể thêm các trường khác cho bảng trung gian nếu cần
        // ví dụ: số lượng tồn kho cho từng size cụ thể của sản phẩm
        // stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        tableName: 'ProductSizes', // Tên bảng trong database
        timestamps: false // Bảng trung gian thường không cần timestamps
    }); //

    // Bảng trung gian thường không cần định nghĩa 'associate' phức tạp ở đây
    // Mối quan hệ Many-to-Many đã được định nghĩa trong model Product và Size
    // ProductSize.associate = (models) => {
        // Có thể định nghĩa belongsTo Product và Size nếu cần truy cập ngược từ đây
        // ProductSize.belongsTo(models.Product, { foreignKey: 'product_id'});
        // ProductSize.belongsTo(models.Size, { foreignKey: 'size_id'});
    // };

    return ProductSize;
}; //