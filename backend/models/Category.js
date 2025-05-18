// backend/models/Category.js
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        category_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        category_name_vi: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: 'Tên loại sản phẩm (Tiếng Việt)'
        },
        category_name_en: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            comment: 'Tên loại sản phẩm (Tiếng Anh)'
        }
    }, {
        tableName: 'Categories',
        timestamps: false,
        comment: 'Bảng lưu các loại sản phẩm (Đa ngôn ngữ)'
    });

    // Category.associate = (models) => {
    //     // Associations được định nghĩa trong config/db.js
    // };

    return Category;
};
