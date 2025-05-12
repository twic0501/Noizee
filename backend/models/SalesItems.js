// models/SalesItems.js (Đã sửa PK, thêm discount_amount, thêm Associations)
module.exports = (sequelize, DataTypes) => {
    const SalesItems = sequelize.define('SalesItems', {
        // --- SỬA ĐỔI PK: Dùng sale_item_id làm PK duy nhất ---
        sale_item_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true // Khóa chính tự tăng cho mỗi dòng item
        },
        sale_id: { // Vẫn là khóa ngoại, bắt buộc, không còn là phần của PK
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Tham chiếu tới bảng Sales
                 model: 'Sales',
                 key: 'sale_id'
             },
            onDelete: 'CASCADE', // Nếu Sale bị xóa, xóa luôn item này
            onUpdate: 'CASCADE'
        },
        product_id: { // Vẫn là khóa ngoại, bắt buộc, không còn là phần của PK
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Tham chiếu tới bảng Products
                 model: 'Products',
                 key: 'product_id'
             },
            onDelete: 'RESTRICT', // QUAN TRỌNG: Không cho xóa Product nếu đã có trong SalesItems
            onUpdate: 'CASCADE'   // Nếu product_id thay đổi thì cập nhật
        },
        // --- Giữ nguyên các trường khác ---
        product_qty: { // Số lượng sản phẩm
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { isInt: true, min: 1 } // Số lượng phải là số nguyên > 0
        },
        price_at_sale: { // Giá gốc của sản phẩm tại thời điểm bán
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false // Lưu giá tại lúc bán để tránh thay đổi giá sau này ảnh hưởng đơn cũ
        },
        // --- THÊM discount_amount ---
        discount_amount: { // Số tiền giảm giá áp dụng cho item này (từ virtual_balance)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false, // Nên là NOT NULL
            defaultValue: 0.00 // Mặc định là không giảm giá
        }
    }, {
        tableName: 'SalesItems', // Tên bảng
        timestamps: false, // Không cần timestamps
        indexes: [ // Thêm indexes cho các khóa ngoại để tăng tốc join
            { fields: ['sale_id'] },
            { fields: ['product_id'] }
        ]
        // Không cần định nghĩa primary key phức hợp ở đây nữa
    }); //

    // --- Định nghĩa Associations ---
     SalesItems.associate = (models) => {
        // Một SalesItem thuộc về một Sale (Many-to-One)
        SalesItems.belongsTo(models.Sale, {
            foreignKey: 'sale_id', //
            as: 'sale' // Alias khi include Sale từ SalesItem
        }); //

        // Một SalesItem thuộc về một Product (Many-to-One)
        SalesItems.belongsTo(models.Product, {
            foreignKey: 'product_id', //
            as: 'product' // Alias khi include Product từ SalesItem
        }); //
    };

    return SalesItems;
};