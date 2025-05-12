// models/Sale.js (Đã thêm Associations)
module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define('Sale', {
        sale_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_date: {
            type: DataTypes.DATEONLY, // Chỉ lưu ngày (YYYY-MM-DD), khớp với kiểu DATE trong SQL
            allowNull: false
        },
        sale_status: {
            type: DataTypes.STRING(50), // Ví dụ: Pending, Processing, Shipped, Delivered, Cancelled
            allowNull: false,
            defaultValue: 'Pending' // Trạng thái mặc định khi mới tạo
        },
        customer_id: { // Khóa ngoại liên kết tới Customers
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Định nghĩa rõ ràng tham chiếu (tùy chọn nhưng nên có)
                model: 'Customers', // Tên bảng Customers trong DB
                key: 'customer_id'
            },
            // onDelete: 'CASCADE', // Hoặc SET NULL, tùy vào logic nghiệp vụ khi xóa Customer
            // onUpdate: 'CASCADE'
        }
        // Thêm display_sale_id nếu bạn lưu mã đơn hàng đặc biệt vào DB
        // display_sale_id: { type: DataTypes.STRING(100), unique: true, allowNull: true },
    }, {
        tableName: 'Sales', // Tên bảng trong DB
        timestamps: false // Không dùng createdAt, updatedAt
    }); //

    // --- Định nghĩa Associations ---
    Sale.associate = (models) => {
        // Một Sale thuộc về một Customer (Many-to-One)
        Sale.belongsTo(models.Customer, {
            foreignKey: 'customer_id', // Khóa ngoại trong bảng Sales
            as: 'customer' // Alias khi include Customer từ Sale
        }); //

        // Một Sale có nhiều SalesItems (One-to-Many)
        Sale.hasMany(models.SalesItems, {
            foreignKey: 'sale_id', // Khóa ngoại trong bảng SalesItems
            as: 'items',           // Alias khi include SalesItems từ Sale
            onDelete: 'CASCADE'    // Nếu xóa Sale, xóa luôn các SalesItems liên quan
        }); //

        // Một Sale có nhiều SalesHistory (One-to-Many)
        Sale.hasMany(models.SalesHistory, {
            foreignKey: 'sale_id', // Khóa ngoại trong bảng SalesHistory
            as: 'history',         // Alias
            onDelete: 'CASCADE'    // Nếu xóa Sale, xóa luôn lịch sử
        }); //

        // Một Sale có một SalesTotals (One-to-One)
        Sale.hasOne(models.SalesTotals, {
            foreignKey: 'sale_id', // Khóa ngoại trong bảng SalesTotals
            as: 'totals',          // Alias
            onDelete: 'CASCADE'    // Nếu xóa Sale, xóa luôn tổng tiền
        }); //
    };

    return Sale;
};