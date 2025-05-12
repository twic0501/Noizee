// models/Color.js
module.exports = (sequelize, DataTypes) => {
    const Color = sequelize.define('Color', {
        color_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        color_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        color_hex: { // Mã màu HEX (vd: #FFFFFF)
            type: DataTypes.STRING(7),
            allowNull: true, // Cho phép null nếu không có mã hex
            unique: true // Mã hex cũng nên là duy nhất nếu có
        }
    }, {
        tableName: 'Colors',
        timestamps: false
    }); //

    Color.associate = (models) => {
        // Color thuộc về nhiều Product (Many-to-Many) thông qua ProductColor
        Color.belongsToMany(models.Product, {
            through: models.ProductColor, // Tên model bảng trung gian
            foreignKey: 'color_id',    // Khóa ngoại trong bảng trung gian trỏ về Color
            otherKey: 'product_id', // Khóa ngoại trong bảng trung gian trỏ về Product
            as: 'products'           // Bí danh khi include Product từ Color
        }); //
    };

    return Color;
};