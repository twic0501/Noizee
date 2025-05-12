// models/SalesTotals.js (Đã thêm Association)
module.exports = (sequelize, DataTypes) => {
    const SalesTotals = sequelize.define('SalesTotals', {
        total_id: { // Khóa chính tự tăng
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_id: { // Khóa ngoại, và cũng là duy nhất (One-to-One với Sales)
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // Đảm bảo mỗi Sale chỉ có một SalesTotal
            references: {
                model: 'Sales', // Tham chiếu bảng Sales
                key: 'sale_id'
            },
            onDelete: 'CASCADE', // Nếu Sale bị xóa, xóa luôn tổng tiền
            onUpdate: 'CASCADE'
        },
        total_amount: { // Tổng tiền cuối cùng của đơn hàng (sau khi đã trừ discount nếu có)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00, // Mặc định là 0
            validate: { isDecimal: true, min: 0 } // Không âm
        }
        // Có thể thêm các trường tổng khác nếu cần (ví dụ: tổng discount, tổng thuế,...)
        // total_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        // total_tax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        // gross_total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 } // Tổng trước thuế/discount
    }, {
        tableName: 'SalesTotals', // Tên bảng
        timestamps: false // Không cần timestamps
    }); //

    // --- Định nghĩa Associations ---
    SalesTotals.associate = (models) => {
        // Một SalesTotals thuộc về một Sale (One-to-One)
        SalesTotals.belongsTo(models.Sale, {
            foreignKey: 'sale_id', // Khóa ngoại trong SalesTotals
            as: 'sale' // Alias khi include Sale từ SalesTotals
        }); //
    };

    return SalesTotals;
};