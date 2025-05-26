// user/src/components/orders/OrderStatusBadge.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '../../utils/helpers';

const OrderStatusBadge = ({ status }) => {
  const { t } = useTranslation();

  // Backend của bạn có thể trả về các status:
  // 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'FAILED'
  // Hãy đảm bảo các key dịch và màu sắc khớp với các giá trị status thực tế từ backend.
  const statusText = t(`orderStatus.${status?.toLowerCase()}`, status); // Fallback về status gốc nếu không có key dịch

  let bgColor = 'bg-gray-100 text-gray-800'; // Default
  let dotColor = 'bg-gray-400';

  switch (status?.toUpperCase()) {
    case 'PENDING':
      bgColor = 'bg-yellow-100 text-yellow-800';
      dotColor = 'bg-yellow-400';
      break;
    case 'PROCESSING':
      bgColor = 'bg-blue-100 text-blue-800';
      dotColor = 'bg-blue-400';
      break;
    case 'SHIPPED':
      bgColor = 'bg-teal-100 text-teal-800';
      dotColor = 'bg-teal-400';
      break;
    case 'DELIVERED':
      bgColor = 'bg-green-100 text-green-800';
      dotColor = 'bg-green-400';
      break;
    case 'CANCELLED':
    case 'FAILED':
      bgColor = 'bg-red-100 text-red-800';
      dotColor = 'bg-red-400';
      break;
    case 'RETURNED':
    case 'REFUNDED':
      bgColor = 'bg-purple-100 text-purple-800';
      dotColor = 'bg-purple-400';
      break;
    default:
      break;
  }

  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4',
        bgColor
      )}
    >
      <svg className={classNames('-ml-0.5 mr-1.5 h-2 w-2', dotColor)} fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      {statusText}
    </span>
  );
};

export default OrderStatusBadge;