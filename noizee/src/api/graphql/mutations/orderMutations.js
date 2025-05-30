import { gql } from '@apollo/client';
import { CORE_ORDER_FIELDS } from '../fragments'; // Giả sử bạn muốn trả về thông tin order sau khi tạo

// Input type 'CreateOrderInput' cần khớp với backend
// Nó thường chứa: items (mảng các sản phẩm trong giỏ), shippingAddressId hoặc shippingAddress (object),
// paymentMethodId, customerNotes, etc.
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createSale(input: $input) { # Hoặc createOrder
      order { # Backend có thể trả về một object order thay vì trực tiếp các trường
        ...CoreOrderFields
        # Thêm các trường chi tiết hơn nếu cần sau khi tạo đơn
        # paymentUrl # Nếu cần redirect tới cổng thanh toán
      }
      # errors { field, message }
    }
  }
  ${CORE_ORDER_FIELDS}
`;