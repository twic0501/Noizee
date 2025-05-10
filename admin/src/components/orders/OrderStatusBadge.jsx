import React from 'react';
import { Badge } from 'react-bootstrap';
import { STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'; // Import constants

// Component hiển thị badge cho trạng thái đơn hàng
function OrderStatusBadge({ status }) {
    const variant = STATUS_COLORS[status] || 'secondary'; // Màu mặc định nếu status không khớp
    // Lấy tên status chuẩn hoặc dùng giá trị gốc
    const displayStatus = ORDER_STATUS[Object.keys(ORDER_STATUS).find(key => ORDER_STATUS[key] === status)] || status;

    return (
        <Badge pill bg={variant} text={variant === 'warning' || variant === 'info' || variant === 'light' ? 'dark' : 'white'}>
           {displayStatus}
        </Badge>
    );
}

export default OrderStatusBadge;