// models/index.js (ĐÃ REFACTOR HOÀN TOÀN)
'use strict';

const fs = require('fs');             // Module xử lý file system
const path = require('path');           // Module xử lý đường dẫn
const Sequelize = require('sequelize'); // Class Sequelize
const basename = path.basename(__filename); // Tên file hiện tại (index.js)
const db = {};                       // Object để chứa các model và instance sequelize

// Import sequelize instance đã được cấu hình từ config/db.js
const { sequelize } = require('../config/db'); //

// Kiểm tra xem sequelize instance có tồn tại không
if (!sequelize) {
  console.error("FATAL ERROR: Sequelize instance not imported from config/db.js");
  process.exit(1);
}

console.log('[models/index.js] Loading model files...'); //

// Đọc tất cả các file trong thư mục hiện tại (__dirname là models)
fs
  .readdirSync(__dirname)
  // Lọc ra các file JavaScript, không phải là file ẩn, không phải là index.js, và không phải file test
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&         // Không phải file ẩn
      file !== basename &&               // Không phải là index.js
      file.slice(-3) === '.js' &&        // Là file .js
      file.indexOf('.test.js') === -1    // Không phải file test
    );
  })
  // Duyệt qua từng file model tìm được
  .forEach(file => {
    try {
      // Import model definition function từ file
      // Hàm này nhận (sequelize, DataTypes) làm tham số
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      // Nếu import thành công và trả về một model hợp lệ (có name)
      if (model && model.name) {
        db[model.name] = model; // Thêm model vào db object với key là tên model
      } else {
         console.warn(`[models/index.js] Warning: File ${file} did not export a valid Sequelize model.`);
      }
    } catch (error) {
       console.error(`[models/index.js] Error loading model file ${file}:`, error); // Log lỗi nếu không import được model
    }
  }); //

console.log('[models/index.js] Finished loading model files. Loaded models:', Object.keys(db).join(', ')); // Log các model đã load

console.log('[models/index.js] Associating models...'); //

// Sau khi tất cả các model đã được import và thêm vào db object,
// duyệt qua từng model và gọi hàm `associate` của nó (nếu có)
// Hàm associate dùng để định nghĩa các mối quan hệ giữa các model
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) { // Kiểm tra xem model có hàm associate không
    db[modelName].associate(db); // Gọi hàm associate và truyền vào db object (chứa tất cả các model khác)
  }
}); //

console.log('[models/index.js] Finished model associations.'); //

// Gắn sequelize instance và Sequelize class vào db object để tiện sử dụng ở nơi khác
db.sequelize = sequelize; //
db.Sequelize = Sequelize; //

module.exports = db; // Export db object chứa các model và sequelize