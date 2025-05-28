// backend/config/db.js
const { Sequelize, Op } = require('sequelize'); // Thêm Op nếu cần dùng trong file này
require('dotenv').config();
const logger = require('../utils/logger');

// Kiểm tra các biến môi trường cần thiết cho DB
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_DIALECT'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    logger.error(`FATAL ERROR: Environment variable ${varName} is not set.`);
    process.exit(1);
  }
}
let sslOptions = null;
if (process.env.DB_SSL === 'true') {
  sslOptions = {
    require: true,
    rejectUnauthorized: true // Đây là cài đặt an toàn và nên được ưu tiên
  };
  logger.info('[DB Config] SSL for database is ENABLED based on DB_SSL env.');
} else {
  logger.warn('[DB Config] SSL for database is DISABLED. TiDB Cloud requires SSL!');
}

logger.info(`[DB Config] Current DB_SSL env value: "${process.env.DB_SSL}"`);
logger.info(`[DB Config] SSL options object for Sequelize: ${JSON.stringify(sslOptions)}`);
// Khởi tạo Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: process.env.DB_DIALECT,
    logging: (process.env.NODE_ENV === 'development' && process.env.SEQUELIZE_LOGGING !== 'false') 
             ? (msg) => logger.debug(`[SEQUELIZE] ${msg}`) 
             : false,
    dialectOptions: {
      ssl: sslOptions // Quan trọng: truyền đối tượng sslOptions vào đây
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    },
    define: {
        // underscored: true, // Nếu muốn các tên cột tự động là snake_case
        // timestamps: true, // Mặc định là true
    }
  }
);

const db = {}; // Object chứa các model và sequelize instance

db.Sequelize = Sequelize; // Class Sequelize
db.sequelize = sequelize; // Instance sequelize đã cấu hình
db.Op = Op; // Thêm Op vào db object để tiện sử dụng ở nơi khác nếu cần

// --- Import models ---
// Các model này cần được export dưới dạng function(sequelize, DataTypes)
db.Customer = require('../models/Customer')(sequelize, Sequelize.DataTypes);
db.Category = require('../models/Category')(sequelize, Sequelize.DataTypes);
db.Size = require('../models/Size')(sequelize, Sequelize.DataTypes);
db.Color = require('../models/Color')(sequelize, Sequelize.DataTypes);
db.Collection = require('../models/Collection')(sequelize, Sequelize.DataTypes);
db.Product = require('../models/Product')(sequelize, Sequelize.DataTypes);
db.ProductImage = require('../models/ProductImage')(sequelize, Sequelize.DataTypes);
db.Inventory = require('../models/Inventory')(sequelize, Sequelize.DataTypes);
db.ProductCollection = require('../models/ProductCollection')(sequelize, Sequelize.DataTypes); // Bảng nối Product-Collection
db.Sale = require('../models/Sale')(sequelize, Sequelize.DataTypes);
db.SalesHistory = require('../models/SalesHistory')(sequelize, Sequelize.DataTypes);
db.SalesItems = require('../models/SalesItems')(sequelize, Sequelize.DataTypes);
db.SalesTotals = require('../models/SalesTotals')(sequelize, Sequelize.DataTypes);

// Blog Models
db.BlogPost = require('../models/BlogPost')(sequelize, Sequelize.DataTypes);
db.BlogTag = require('../models/BlogTag')(sequelize, Sequelize.DataTypes);
db.BlogComment = require('../models/BlogComment')(sequelize, Sequelize.DataTypes);
db.BlogPostTag = require('../models/BlogPostTag')(sequelize, Sequelize.DataTypes); // Bảng nối BlogPost-BlogTag

// --- Define Associations ---
// Gọi hàm associate của từng model nếu nó tồn tại và bạn muốn tách logic associate ra model file.
// Hoặc định nghĩa trực tiếp ở đây. Để nhất quán với file cũ của bạn, chúng ta định nghĩa ở đây.

// Associations cho phần bán hàng
if (db.Customer && db.Sale) {
    db.Customer.hasMany(db.Sale, { foreignKey: 'customer_id', as: 'sales' });
    db.Sale.belongsTo(db.Customer, { foreignKey: 'customer_id', as: 'customer' });
}

if (db.Sale && db.SalesHistory) {
    db.Sale.hasMany(db.SalesHistory, { foreignKey: 'sale_id', as: 'history', onDelete: 'CASCADE' });
    db.SalesHistory.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' });
}

if (db.Sale && db.SalesItems) {
    db.Sale.hasMany(db.SalesItems, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
    db.SalesItems.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' });
}

if (db.Product && db.SalesItems) {
    db.Product.hasMany(db.SalesItems, { foreignKey: 'product_id', as: 'saleItems' });
    db.SalesItems.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product', onDelete: 'SET NULL' });
}

if (db.Sale && db.SalesTotals) {
    db.Sale.hasOne(db.SalesTotals, { foreignKey: 'sale_id', as: 'totals', onDelete: 'CASCADE' });
    db.SalesTotals.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' });
}

if (db.Category && db.Product) {
    db.Category.hasMany(db.Product, { foreignKey: 'category_id', as: 'products' });
    db.Product.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category', onDelete: 'SET NULL' });
}

if (db.Product && db.ProductImage) {
    db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
    db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });
}

if (db.Color && db.ProductImage) {
    db.Color.hasMany(db.ProductImage, { foreignKey: 'color_id', as: 'productImages', required: false }); // color_id có thể NULL
    db.ProductImage.belongsTo(db.Color, { foreignKey: 'color_id', as: 'color', onDelete: 'SET NULL' });
}

if (db.Product && db.Inventory) {
    db.Product.hasMany(db.Inventory, { foreignKey: 'product_id', as: 'inventoryItems', onDelete: 'CASCADE' });
    db.Inventory.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });
}

if (db.Size && db.Inventory) {
    db.Size.hasMany(db.Inventory, { foreignKey: 'size_id', as: 'inventoryItems', required: false });
    db.Inventory.belongsTo(db.Size, { foreignKey: 'size_id', as: 'size', onDelete: 'SET NULL' }); // Hoặc CASCADE nếu xóa Size thì xóa Inventory
}

if (db.Color && db.Inventory) {
    db.Color.hasMany(db.Inventory, { foreignKey: 'color_id', as: 'inventoryItemsByColor', required: false }); // Đổi alias để tránh trùng với ProductImage
    db.Inventory.belongsTo(db.Color, { foreignKey: 'color_id', as: 'colorDetail', onDelete: 'SET NULL' }); // Đổi alias
}

if (db.Product && db.Collection && db.ProductCollection) {
    db.Product.belongsToMany(db.Collection, {
      through: db.ProductCollection,
      foreignKey: 'product_id',
      otherKey: 'collection_id',
      as: 'collections'
    });
    db.Collection.belongsToMany(db.Product, {
      through: db.ProductCollection,
      foreignKey: 'collection_id',
      otherKey: 'product_id',
      as: 'products'
    });
}

// Associations cho Blog
if (db.Customer && db.BlogPost) {
    db.Customer.hasMany(db.BlogPost, { foreignKey: 'user_id', as: 'blogPosts'});
    db.BlogPost.belongsTo(db.Customer, { foreignKey: 'user_id', as: 'author', onDelete: 'SET NULL'});
}

if (db.BlogPost && db.BlogComment) {
    db.BlogPost.hasMany(db.BlogComment, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE'});
    db.BlogComment.belongsTo(db.BlogPost, { foreignKey: 'post_id', as: 'post'});
}

if (db.BlogPost && db.BlogTag && db.BlogPostTag) {
    db.BlogPost.belongsToMany(db.BlogTag, {
        through: db.BlogPostTag,
        foreignKey: 'post_id',
        otherKey: 'tag_id',
        as: 'tags'
    });
    db.BlogTag.belongsToMany(db.BlogPost, {
        through: db.BlogPostTag,
        foreignKey: 'tag_id',
        otherKey: 'post_id',
        as: 'posts'
    });
}

if (db.Customer && db.BlogComment) {
    db.Customer.hasMany(db.BlogComment, { foreignKey: 'user_id', as: 'blogComments'});
    db.BlogComment.belongsTo(db.Customer, { foreignKey: 'user_id', as: 'commentAuthor', onDelete: 'SET NULL'}); // Đổi alias 'author' thành 'commentAuthor' để tránh trùng với BlogPost.author
}

if (db.BlogComment) {
    // Quan hệ tự tham chiếu cho bình luận trả lời
    db.BlogComment.hasMany(db.BlogComment, { foreignKey: 'parent_comment_id', as: 'replies', onDelete: 'CASCADE'});
    db.BlogComment.belongsTo(db.BlogComment, { foreignKey: 'parent_comment_id', as: 'parentComment'});
}


// --- Function to test connection ---
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`Database connected successfully to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} (using ${sequelize.options.dialect} dialect).`);
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true }); // Cẩn thận với alter:true ở production
    //   logger.info('Database synchronized (alter: true).');
    // }
  } catch (error) {
    logger.error('Unable to connect to the database:', error.message);
    if (error.original) { logger.error('Original database error:', error.original); }
    else { logger.error('Full error details:', error); }
    process.exit(1);
  }
};

// Export db object (chứa models và sequelize) và hàm connectDB
module.exports = { db, connectDB, sequelize };
