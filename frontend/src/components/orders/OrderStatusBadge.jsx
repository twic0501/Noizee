// src/components/orders/OrderStatusBadge.jsx
import React from 'react';
import { Badge } from 'react-bootstrap';
import { ORDER_STATUS } from '../../utils/constants'; // Giả sử bạn có định nghĩa các status

// Định nghĩa màu sắc cho từng trạng thái (có thể đặt trong constants.js)
const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: { bg: 'secondary', text: 'dark', label: 'Chờ xử lý' },
  [ORDER_STATUS.PROCESSING]: { bg: 'primary', text: 'white', label: 'Đang xử lý' },
  [ORDER_STATUS.SHIPPED]: { bg: 'info', text: 'dark', label: 'Đã giao hàng' },
  [ORDER_STATUS.DELIVERED]: { bg: 'success', text: 'white', label: 'Hoàn thành' },
  [ORDER_STATUS.COMPLETED]: { bg: 'success', text: 'white', label: 'Hoàn thành' }, // Có thể gộp với Delivered
  [ORDER_STATUS.CANCELLED]: { bg: 'danger', text: 'white', label: 'Đã hủy' },
  [ORDER_STATUS.REFUNDED]: { bg: 'warning', text: 'dark', label: 'Đã hoàn tiền'}, // Ví dụ thêm
  DEFAULT: { bg: 'light', text: 'dark', label: 'Không xác định' },
};

function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
  const displayLabel = config.label || status; // Fallback về status gốc nếu không có label

  return (
    <Badge bg={config.bg} text={config.text} pill className="order-status-badge">
      {displayLabel}
    </Badge>
  );
}

export default OrderStatusBadge;

/* Thêm CSS nếu cần cho .order-status-badge */
/* Ví dụ:
.order-status-badge {
    font-size: 0.8em;
    padding: 0.4em 0.7em;
}
*/