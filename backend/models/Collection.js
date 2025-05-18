// backend/models/Collection.js
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Collection = sequelize.define('Collection', {
        collection_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        collection_name_vi: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Tên bộ sưu tập (Tiếng Việt)'
        },
        collection_name_en: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Tên bộ sưu tập (Tiếng Anh)'
        },
        collection_description_vi: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả bộ sưu tập (Tiếng Việt)'
        },
        collection_description_en: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả bộ sưu tập (Tiếng Anh)'
        },
        slug: {
            type: DataTypes.STRING(110),
            allowNull: false,
            unique: true,
            comment: 'Slug cho URL thân thiện (chung cho các ngôn ngữ)'
        }
    }, {
        tableName: 'Collections',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['collection_name_vi']
            },
            {
                unique: true,
                fields: ['collection_name_en'],
                where: {
                    collection_name_en: {
                        [Op.ne]: null
                    }
                }
            }
        ],
        comment: 'Bảng lưu các bộ sưu tập sản phẩm (Đa ngôn ngữ)'
    });

    // Collection.associate = (models) => {
    //     // Associations được định nghĩa trong config/db.js
    // };

    return Collection;
};
