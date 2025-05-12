// models/SalesHistory.js (Đã thêm Association)
module.exports = (sequelize, DataTypes) => {
    const SalesHistory = sequelize.define('SalesHistory', {
        history_id: { // Khóa chính tự tăng
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_id: { // Khóa ngoại đến Sales
            type: DataTypes.INTEGER,
            allowNull: false, // Nên NOT NULL
            references: {
                model: 'Sales', // Tham chiếu đến bảng Sales
                key: 'sale_id'
            },
            onDelete: 'CASCADE', // Quan trọng: Nếu Sale bị xóa, lịch sử cũng bị xóa
            onUpdate: 'CASCADE'
        },
        history_date: { // Dùng DATETIME để lưu cả ngày và giờ
            type: DataTypes.DATE, // Kiểu DATE của Sequelize tương ứng DATETIME/TIMESTAMP SQL
            allowNull: false,
            defaultValue: DataTypes.NOW // Tự động lấy giờ hiện tại khi tạo
        },
        history_status: { // Trạng thái tại thời điểm đó
            type: DataTypes.STRING(50),
            allowNull: false
        },
        history_notes: { // Ghi chú thêm (ví dụ: lý do hủy, người cập nhật)
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'SalesHistory', // Tên bảng
        timestamps: false, // Không dùng timestamps của Sequelize vì đã có history_date
        indexes: [ // Đảm bảo có index trên sale_id để tăng tốc truy vấn lịch sử của 1 đơn hàng
            { fields: ['sale_id'] }
        ]
    }); //

    // --- Định nghĩa Associations ---
    SalesHistory.associate = (models) => {
        // Một SalesHistory thuộc về một Sale (Many-to-One)
        SalesHistory.belongsTo(models.Sale, {
            foreignKey: 'sale_id', // Khóa ngoại trong SalesHistory
            as: 'sale' // Alias khi include Sale từ SalesHistory
        }); //
    };

    return SalesHistory;
};