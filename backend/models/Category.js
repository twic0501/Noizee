// models/Category.js
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        category_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        category_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true // Đảm bảo tên category không trùng lặp
        }
    }, {
        tableName: 'Categories', // Chỉ định rõ tên bảng trong database
        timestamps: false // Không sử dụng createdAt và updatedAt
    }); //

    // Định nghĩa mối quan hệ (Association)
    Category.associate = (models) => {
        // Một Category có thể có nhiều Product (One-to-Many)
        Category.hasMany(models.Product, {
            foreignKey: 'category_id', // Khóa ngoại trong bảng Products
            as: 'products'            // Bí danh khi truy vấn include
        }); //
    };

    return Category;
};