// models/Size.js
module.exports = (sequelize, DataTypes) => {
    const Size = sequelize.define('Size', {
        size_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        size_name: {
            type: DataTypes.STRING(10), // Ví dụ: S, M, L, XL, 38, 39,...
            allowNull: false,
            unique: true // Tên size phải là duy nhất
        }
        // Có thể thêm trường mô tả size nếu cần
        // size_description: { type: DataTypes.STRING(50), allowNull: true }
    }, {
        tableName: 'Sizes', // Tên bảng
        timestamps: false // Không cần timestamps
    }); //

    Size.associate = (models) => {
        // Size thuộc về nhiều Product (Many-to-Many) thông qua bảng ProductSize
        Size.belongsToMany(models.Product, {
            through: models.ProductSize, // Model bảng trung gian
            foreignKey: 'size_id',      // Khóa ngoại trong bảng trung gian trỏ về Size
            otherKey: 'product_id',  // Khóa ngoại trong bảng trung gian trỏ về Product
            as: 'products'           // Alias khi include Product từ Size
        }); //
    };

    return Size;
};