// backend/models/BlogComment.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class BlogComment extends Model {}

  BlogComment.init({
    comment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'BlogPosts',
        key: 'post_id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'customer_id',
      },
    },
    parent_comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'BlogComments',
        key: 'comment_id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending_approval', 'approved', 'spam', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
    }
  }, {
    sequelize,
    modelName: 'BlogComment',
    tableName: 'BlogComments',
    timestamps: true,
    underscored: true,
    comment: 'Bảng lưu trữ các bình luận cho bài viết blog'
  });

  // BlogComment.associate = (models) => {
  //     // Associations được định nghĩa trong config/db.js
  // };

  return BlogComment;
};
