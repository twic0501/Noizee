import { gql } from '@apollo/client';
import { CORE_ORDER_FIELDS } from '../fragments'; // Giả sử bạn có fragment này

// Subscription này sẽ lắng nghe cập nhật trạng thái của một đơn hàng cụ thể
// Tên và cấu trúc của subscription này phải khớp với schema backend của bạn.
export const ON_ORDER_UPDATED = gql`
  subscription OnOrderUpdated($orderId: ID!) {
    orderUpdated(orderId: $orderId) {
      ...CoreOrderFields
      # Thêm các trường bạn muốn nhận khi đơn hàng được cập nhật
      # ví dụ: status, paymentStatus, shippingStatus, updatedAt
      # items { id, quantity, product { name } } # Có thể cần cập nhật cả items
    }
  }
  ${CORE_ORDER_FIELDS}
`;

// Ví dụ một subscription khác: lắng nghe đơn hàng mới cho admin (nếu có)
// export const ON_NEW_ORDER_CREATED = gql`
//   subscription OnNewOrderCreated {
//     newOrderCreated {
//       ...CoreOrderFields
//     }
//   }
//   ${CORE_ORDER_FIELDS}
// `;