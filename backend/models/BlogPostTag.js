// backend/models/BlogPostTag.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class BlogPostTag extends Model {}

  BlogPostTag.init({
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'BlogPosts', // Tên bảng
        key: 'post_id',
      },
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'BlogTags', // Tên bảng
        key: 'tag_id',
      },
    },
  }, {
    sequelize,
    modelName: 'BlogPostTag',
    tableName: 'BlogPostTags',
    timestamps: false,
    underscored: true,
    comment: 'Bảng trung gian liên kết bài viết và thẻ (quan hệ nhiều-nhiều)'
  });
  return BlogPostTag;
};
