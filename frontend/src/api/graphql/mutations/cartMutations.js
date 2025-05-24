// src/api/graphql/mutations/cartMutations.js
import { gql } from '@apollo/client';

// Mutation để tạo một đơn hàng mới
// Đồng bộ hóa:
// - Tên mutation: 'createSale' khớp với backend.
// - Biến đầu vào:
//   - '$items': Kiểu '[SaleItemInput!]!' khớp với backend.
//     'SaleItemInput' ở backend bao gồm 'product_id', 'product_qty', 'size_id', 'color_id'. Frontend gửi đúng cấu trúc này.
//   - '$shippingInfo': Kiểu 'SaleShippingInfoInput' khớp với backend. (Lưu ý: trong query hiện tại của bạn, biến $shippingInfo chưa được khai báo trong `mutation CreateSale(...)`, nhưng resolver backend `createSale` có nhận `shippingInfo`. Chúng ta nên thêm nó vào định nghĩa mutation của frontend nếu bạn muốn gửi thông tin này.)
// - Payload trả về: Yêu cầu 'sale_id', 'sale_date', 'sale_status', 'totals { total_amount }', và 'customer { customer_id, virtual_balance }'.
//   Điều này khớp với kiểu 'Sale' và 'Customer' ở backend, và rất hữu ích để cập nhật UI sau khi đặt hàng.
export const CREATE_SALE_MUTATION = gql`
  mutation CreateSale($items: [SaleItemInput!]!, $shippingInfo: SaleShippingInfoInput) { # Thêm $shippingInfo ở đây
    createSale(items: $items, shippingInfo: $shippingInfo) { # Truyền shippingInfo vào resolver
      sale_id
      sale_date
      sale_status
      totals {
        total_amount
        subtotal_amount # Có thể hữu ích để hiển thị chi tiết hơn
        discount_total  # Hiển thị số tiền đã giảm
        shipping_fee    # Hiển thị phí ship
      }
      customer {
        customer_id
        virtual_balance # Cập nhật số dư ảo sau khi trừ
      }
      # Bạn có thể bỏ comment phần 'items' nếu cần hiển thị lại chi tiết các sản phẩm trong đơn hàng vừa tạo
      # trên trang xác nhận đơn hàng chẳng hạn.
      # items {
      #   sale_item_id
      #   product_qty
      #   price_at_sale
      #   discount_amount
      #   product_name_at_sale # Tên SP tại thời điểm mua
      #   # product_sku_at_sale # SKU tại thời điểm mua
      #   product { # Thông tin SP gốc
      #     product_id
      #     name(lang: "vi") # Hoặc ngôn ngữ hiện tại của người dùng
      #     # Hoặc product_name_vi / product_name_en nếu bạn không dùng resolver ảo 'name'
      #   }
      #   size { # Thông tin size đã chọn
      #     size_id
      #     size_name
      #   }
      #   color { # Thông tin color đã chọn
      #     color_id
      #     name(lang: "vi") # Hoặc ngôn ngữ hiện tại
      #     color_hex
      #   }
      # }
    }
  }
`;