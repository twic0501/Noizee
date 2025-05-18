// backend/models/SalesHistory.js
module.exports = (sequelize, DataTypes) => {
    const SalesHistory = sequelize.define('SalesHistory', {
        history_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sale_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Sales',
                key: 'sale_id'
            }
        },
        history_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        history_status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Trạng thái tại thời điểm ghi lịch sử'
        },
        history_notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ghi chú cho lần thay đổi trạng thái'
        }
    }, {
        tableName: 'SalesHistory',
        timestamps: false, // history_date đã có, không cần timestamps của Sequelize
        comment: 'Bảng lưu lịch sử thay đổi trạng thái đơn hàng'
    });

    SalesHistory.associate = (models) => {
        SalesHistory.belongsTo(models.Sale, {
            foreignKey: 'sale_id',
            as: 'sale',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return SalesHistory;
};
