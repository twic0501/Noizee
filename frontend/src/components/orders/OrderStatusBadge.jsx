// src/components/orders/OrderStatusBadge.jsx
import React from 'react';
import { Badge } from 'react-bootstrap';
import { ORDER_STATUS } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT

function OrderStatusBadge({ status }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK

  // Key dịch cho từng trạng thái, ví dụ: orderStatus.Pending, orderStatus.Processing
  const statusLabelKey = `orderStatus.${status || 'Unknown'}`; 
  const displayLabel = t(statusLabelKey, status); // Fallback về status gốc nếu key không tồn tại

  // Cấu hình màu sắc có thể giữ nguyên, chỉ dịch label
  const STATUS_CONFIG = {
    [ORDER_STATUS.PENDING]: { bg: 'secondary', text: 'dark' },
    [ORDER_STATUS.PROCESSING]: { bg: 'primary', text: 'white' },
    [ORDER_STATUS.SHIPPED]: { bg: 'info', text: 'dark' },
    [ORDER_STATUS.DELIVERED]: { bg: 'success', text: 'white' },
    [ORDER_STATUS.COMPLETED]: { bg: 'success', text: 'white' },
    [ORDER_STATUS.CANCELLED]: { bg: 'danger', text: 'white' },
    [ORDER_STATUS.REFUNDED]: { bg: 'warning', text: 'dark'},
    DEFAULT: { bg: 'light', text: 'dark' },
  };
  
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

  return (
    <Badge bg={config.bg} text={config.text} pill className="order-status-badge">
      {displayLabel}
    </Badge>
  );
}

export default OrderStatusBadge;
  