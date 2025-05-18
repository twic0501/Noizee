// backend/models/BlogTag.js
const { DataTypes, Model, Op } = require('sequelize'); // Import Op

module.exports = (sequelize) => { // DataTypes được truyền bởi config/db.js
  class BlogTag extends Model {}

  BlogTag.init({
    tag_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name_vi: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tên thẻ (Tiếng Việt)'
    },
    name_en: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tên thẻ (Tiếng Anh)'
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Chuỗi URL thân thiện cho thẻ (chung cho các ngôn ngữ)'
    }
  }, {
    sequelize,
    modelName: 'BlogTag',
    tableName: 'BlogTags',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['name_vi']
        },
        {
            unique: true,
            fields: ['name_en'],
            where: {
                name_en: {
                    [Op.ne]: null // Sử dụng Op đã import
                }
            }
        }
    ],
    comment: 'Bảng lưu trữ các thẻ (tags) cho bài viết blog (Đa ngôn ngữ)'
  });

  // BlogTag.associate = (models) => {
  //     // Associations được định nghĩa trong config/db.js
  // };

  return BlogTag;
};
