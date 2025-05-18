// backend/models/BlogPost.js
const { DataTypes, Model } = require('sequelize'); // Model có thể không cần thiết nếu không dùng instance methods phức tạp

module.exports = (sequelize) => { // DataTypes sẽ được truyền bởi config/db.js
  class BlogPost extends Model {} // Giữ lại class nếu bạn có custom methods cho BlogPost sau này

  BlogPost.init({
    post_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'customer_id',
      },
    },
    title_vi: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tiêu đề bài viết (Tiếng Việt)'
    },
    title_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề bài viết (Tiếng Anh)'
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Chuỗi URL thân thiện, duy nhất cho bài viết (chung cho các ngôn ngữ)'
    },
    excerpt_vi: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Đoạn tóm tắt ngắn cho bài viết (Tiếng Việt)'
    },
    excerpt_en: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Đoạn tóm tắt ngắn cho bài viết (Tiếng Anh)'
    },
    content_html_vi: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Nội dung bài viết dưới dạng HTML (Tiếng Việt)'
    },
    content_html_en: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Nội dung bài viết dưới dạng HTML (Tiếng Anh)'
    },
    content_markdown_vi: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Nội dung bài viết dưới dạng Markdown (Tiếng Việt - tùy chọn lưu trữ)'
    },
    content_markdown_en: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Nội dung bài viết dưới dạng Markdown (Tiếng Anh - tùy chọn lưu trữ)'
    },
    featured_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'members_only'),
      allowNull: false,
      defaultValue: 'public',
    },
    allow_comments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    template_key: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    meta_title_vi: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề meta cho SEO (Tiếng Việt)'
    },
    meta_title_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề meta cho SEO (Tiếng Anh)'
    },
    meta_description_vi: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả meta cho SEO (Tiếng Việt)'
    },
    meta_description_en: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả meta cho SEO (Tiếng Anh)'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'BlogPost',
    tableName: 'BlogPosts',
    timestamps: true, // created_at, updated_at
    underscored: true,
    comment: 'Bảng lưu trữ các bài viết blog (Đa ngôn ngữ)'
  });

  // BlogPost.associate = (models) => {
  //     // Associations được định nghĩa trong config/db.js
  // };

  return BlogPost;
};
