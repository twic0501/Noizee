// backend/models/ProductImage.js
module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define('ProductImage', {
        image_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'product_id'
            }
        },
        color_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Colors',
                key: 'color_id'
            },
            comment: 'Khóa ngoại đến Colors (NULL nếu là ảnh chung, không theo màu cụ thể)'
        },
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Đường dẫn hoặc URL của file ảnh'
        },
        alt_text_vi: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Mô tả ảnh (Tiếng Việt - cho SEO và người khiếm thị)'
        },
        alt_text_en: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Mô tả ảnh (Tiếng Anh - cho SEO và người khiếm thị)'
        },
        display_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Thứ tự hiển thị (0 = chính, 1 = phụ/hover, 2+ = gallery)'
        }
    }, {
        tableName: 'ProductImages',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['product_id', 'color_id', 'display_order'],
                name: 'unique_display_order'
            },
            {
                fields: ['product_id', 'color_id', 'display_order'],
                name: 'idx_product_color_order'
            }
        ],
        comment: 'Lưu trữ nhiều hình ảnh cho sản phẩm, có thể gắn với màu sắc cụ thể (Đa ngôn ngữ cho alt_text)'
    });

    // ProductImage.associate = (models) => {
    //     // Associations được định nghĩa trong config/db.js
    // };

    return ProductImage;
};
