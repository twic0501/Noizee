// config/db.js (Phiên bản đầy đủ đã bổ sung model imports và associations)
const { Sequelize } = require('sequelize');
require('dotenv').config(); // [cite: 2]

// Kiểm tra các biến môi trường cần thiết cho DB
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is not set.`);
    if (process.env.NODE_ENV === 'production') { // Thoát nếu là production [cite: 3]
        process.exit(1);
    }
    // Ở development có thể không thoát ngay để dễ debug, nhưng DB sẽ không kết nối được
  }
}

// Khởi tạo Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql', // Mặc định là mysql nếu không có
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries ở dev
    // dialectOptions cho các cấu hình đặc biệt của dialect (ví dụ SSL)
    dialectOptions: {
      // Bật SSL nếu cần (ví dụ: kết nối tới PlanetScale, Azure MySQL)
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false // Có thể cần set false nếu dùng cert tự ký
      // }
    },
    pool: { // Cấu hình connection pool [cite: 3]
      max: 5, // Số kết nối tối đa
      min: 0, // Số kết nối tối thiểu
      acquire: 30000, // Timeout khi lấy kết nối (ms)
      idle: 10000 // Timeout khi kết nối rảnh (ms) trước khi bị giải phóng
    }
  }
);

const db = {}; // Object chứa các model và sequelize instance

db.Sequelize = Sequelize; // Class Sequelize
db.sequelize = sequelize; // Instance sequelize đã cấu hình

// --- Import models ---
// Import lần lượt các file định nghĩa model và truyền sequelize, Sequelize vào
db.Customer = require('../models/Customer')(sequelize, Sequelize); // [cite: 4]
db.Product = require('../models/Product')(sequelize, Sequelize); // [cite: 5]
db.Sale = require('../models/Sale')(sequelize, Sequelize); // [cite: 5]
db.SalesHistory = require('../models/SalesHistory')(sequelize, Sequelize); // [cite: 5]
db.SalesItems = require('../models/SalesItems')(sequelize, Sequelize); // [cite: 5]
db.SalesTotals = require('../models/SalesTotals')(sequelize, Sequelize); // [cite: 5]
db.Category = require('../models/Category')(sequelize, Sequelize); // [cite: 6]
db.Size = require('../models/Size')(sequelize, Sequelize); // [cite: 6]
db.ProductSize = require('../models/ProductSize')(sequelize, Sequelize); // [cite: 6] Bảng trung gian Product-Size
db.Color = require('../models/Color')(sequelize, Sequelize); // [cite: 6]
db.ProductColor = require('../models/ProductColor')(sequelize, Sequelize); // [cite: 6] Bảng trung gian Product-Color
db.Collection = require('../models/Collection')(sequelize, Sequelize); // [cite: 7]
db.ProductCollection = require('../models/ProductCollection')(sequelize, Sequelize); // [cite: 7] Bảng trung gian Product-Collection

// --- Define Associations ---
// Gọi hàm associate của từng model nếu nó tồn tại
// Lưu ý: Cách tốt hơn là thực hiện việc này trong file models/index.js
// Tuy nhiên, làm ở đây cũng hoạt động nếu các model được import đúng thứ tự
// Hoặc nếu bạn chắc chắn tất cả model đã được load trước khi gọi associate.

// Customer - Sale (One-to-Many)
db.Customer.hasMany(db.Sale, { foreignKey: 'customer_id', as: 'sales' }); // [cite: 7]
db.Sale.belongsTo(db.Customer, { foreignKey: 'customer_id', as: 'customer' }); // [cite: 8]

// Sale - SalesHistory (One-to-Many)
db.Sale.hasMany(db.SalesHistory, { foreignKey: 'sale_id', as: 'history' }); // [cite: 8]
db.SalesHistory.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' }); // [cite: 9]

// Sale - SalesItems (One-to-Many)
db.Sale.hasMany(db.SalesItems, { foreignKey: 'sale_id', as: 'items' }); // [cite: 9]
db.SalesItems.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' }); // [cite: 10]

// Product - SalesItems (One-to-Many)
db.Product.hasMany(db.SalesItems, { foreignKey: 'product_id', as: 'saleItems' }); // [cite: 10]
db.SalesItems.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' }); // [cite: 11]

// Sale - SalesTotals (One-to-One)
db.Sale.hasOne(db.SalesTotals, { foreignKey: 'sale_id', as: 'totals' }); // [cite: 11]
db.SalesTotals.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' }); // [cite: 12]

// Category - Product (One-to-Many)
db.Category.hasMany(db.Product, { foreignKey: 'category_id', as: 'products' }); // [cite: 12]
db.Product.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' }); // [cite: 13]

// Product - Size (Many-to-Many through ProductSize)
db.Product.belongsToMany(db.Size, {
  through: db.ProductSize,
  foreignKey: 'product_id',
  otherKey: 'size_id',
  as: 'sizes' // [cite: 13]
});
db.Size.belongsToMany(db.Product, {
  through: db.ProductSize,
  foreignKey: 'size_id',
  otherKey: 'product_id',
  as: 'products' // [cite: 14]
});

// Product - Color (Many-to-Many through ProductColor)
db.Product.belongsToMany(db.Color, {
  through: db.ProductColor,
  foreignKey: 'product_id',
  otherKey: 'color_id',
  as: 'colors' // [cite: 15]
});
db.Color.belongsToMany(db.Product, {
  through: db.ProductColor,
  foreignKey: 'color_id',
  otherKey: 'product_id',
  as: 'products' // [cite: 16]
});

// Product - Collection (Many-to-Many through ProductCollection)
db.Product.belongsToMany(db.Collection, {
  through: db.ProductCollection,
  foreignKey: 'product_id',
  otherKey: 'collection_id',
  as: 'collections' // [cite: 17]
});
db.Collection.belongsToMany(db.Product, {
  through: db.ProductCollection,
  foreignKey: 'collection_id',
  otherKey: 'product_id',
  as: 'products' // [cite: 18]
});

// --- Function to test connection ---
const connectDB = async () => {
  try {
    await sequelize.authenticate(); // [cite: 19]
    console.log(`Database connected successfully to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} (using ${sequelize.options.dialect} dialect).`); // [cite: 20]
  } catch (error) {
    console.error('Unable to connect to the database:', error.message); // [cite: 20]
    process.exit(1); // Thoát ứng dụng nếu không kết nối được DB
  }
};

// Export db object (chứa models và sequelize) và hàm connectDB
module.exports = { db, connectDB, sequelize }; // [cite: 21] Export cả sequelize instance