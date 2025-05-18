// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize'); // Class Sequelize
const process = require('process'); // Để truy cập process.env
const basename = path.basename(__filename);
const logger = require('../utils/logger'); // Giả sử bạn có logger ở utils

const db = {};

// Import sequelize instance đã được cấu hình từ config/db.js
// Đây là instance đã kết nối và cấu hình với database của bạn.
const { sequelize } = require('../config/db'); // Đảm bảo đường dẫn này chính xác

if (!sequelize) {
  logger.error("FATAL ERROR: Sequelize instance not properly imported from config/db.js. Check config/db.js export.");
  process.exit(1);
}

logger.info('[models/index.js] Starting to load model files...');

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&         // Không phải file ẩn (bắt đầu bằng '.')
      file !== basename &&               // Không phải chính file index.js này
      file.slice(-3) === '.js' &&        // Phải là file JavaScript
      file.indexOf('.test.js') === -1    // Loại trừ các file test (nếu có)
    );
  })
  .forEach(file => {
    try {
      // Import mỗi file model.
      // Hàm require trả về một function (được export từ mỗi file model),
      // sau đó gọi function đó với (sequelize, Sequelize.DataTypes).
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      if (model && model.name) { // Kiểm tra xem model có được định nghĩa hợp lệ không
        db[model.name] = model; // Thêm model vào db object (ví dụ: db.Product, db.Customer)
        // logger.debug(`[models/index.js] Successfully loaded model: ${model.name} from ${file}`);
      } else {
         logger.warn(`[models/index.js] Warning: File ${file} did not export a valid Sequelize model or model.name is missing.`);
      }
    } catch (error) {
       logger.error(`[models/index.js] Error loading model file ${file}:`, error.message);
       // Log thêm stack trace nếu ở development để dễ debug
       if (process.env.NODE_ENV === 'development') {
           logger.error(error.stack);
       }
    }
  });

logger.info(`[models/index.js] Finished loading model files. Loaded models: ${Object.keys(db).join(', ')}`);

logger.info('[models/index.js] Associating models...');
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    // Gọi hàm associate của mỗi model (nếu có) để thiết lập các mối quan hệ
    db[modelName].associate(db); // Truyền toàn bộ db object (chứa tất cả các model) vào hàm associate
    // logger.debug(`[models/index.js] Called associate for model: ${modelName}`);
  }
});
logger.info('[models/index.js] Finished model associations.');

// Gắn sequelize instance và class Sequelize vào db object để tiện truy cập từ các nơi khác
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; // Export db object chứa tất cả các model và sequelize instance
