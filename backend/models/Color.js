// models/Color.js
module.exports = (sequelize, DataTypes) => {
    const Color = sequelize.define('Color', {
        // ... các trường của bạn giữ nguyên ...
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
        color_hex: {
            type: DataTypes.STRING(7),
            allowNull: true,
            unique: true
        }
    }, {
        tableName: 'Colors',
        timestamps: false
    });

    Color.associate = (models) => {
        Color.hasMany(models.Inventory, {
        foreignKey: 'color_id',
        as: 'inventoryItems' // Hoặc một alias khác bạn muốn
    });

        // >>> THÊM DÒNG NÀY VÀO Color.associate <<<
        Color.hasMany(models.ProductImage, {
            foreignKey: 'color_id',
            as: 'productImages' // Alias để truy vấn
        });
        // >>> KẾT THÚC THÊM DÒNG <<<
    };

    return Color;
};