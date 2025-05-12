// models/ProductColor.js
// Model cho bảng trung gian kết nối Product và Color (Many-to-Many)
module.exports = (sequelize, DataTypes) => {
    const ProductColor = sequelize.define('ProductColor', {
        // Khóa ngoại trỏ tới Product, đồng thời là phần của PK
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: 'Products', key: 'product_id' }, // Tham chiếu Products
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        // Khóa ngoại trỏ tới Color, đồng thời là phần của PK
        color_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: 'Colors', key: 'color_id' }, // Tham chiếu Colors
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    }, {
        tableName: 'ProductColors', // Tên bảng
        timestamps: false // Không cần timestamps
    }); //

    // No complex associations needed here typically
    return ProductColor;
}; //