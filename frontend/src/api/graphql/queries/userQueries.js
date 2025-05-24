// src/api/graphql/queries/userQueries.js
import { gql } from '@apollo/client';

// Query lấy thông tin profile người dùng hiện tại
// Đồng bộ hóa:
// - Tên query 'myProfile' khớp với backend.
// - Các trường yêu cầu (customer_id, customer_name, username, customer_email, customer_tel, customer_address, virtual_balance, isAdmin)
//   khớp với kiểu 'Customer' ở backend và resolver 'myProfile' (trừ các trường nhạy cảm).
export const GET_MY_PROFILE_QUERY = gql`
  query GetMyProfile {
    myProfile {
      customer_id
      customer_name
      username
      customer_email
      customer_tel
      customer_address
      virtual_balance
      isAdmin
    }
  }
`;

// Query lấy chi tiết 1 đơn hàng của user
// Đồng bộ hóa:
// - Tên query 'mySaleDetail' và tham số 'id' khớp với backend.
// - Các trường yêu cầu trong 'Sale' (sale_id, sale_date, sale_status, shipping_name, etc.) khớp.
// - Lồng ghép 'customer', 'items', 'totals', 'history' khớp với cấu trúc Sale type ở backend.
// - Trong 'items':
//   - 'product_name_at_sale', 'product_sku_at_sale' là các trường snapshot tốt.
//   - 'product { product_id, name, images }': Lấy thông tin sản phẩm gốc.
//     - Thay 'product_name' bằng 'name' để sử dụng resolver ảo hỗ trợ đa ngôn ngữ (nếu cần truyền $lang).
//     - Thay 'imageUrl' bằng 'images { image_url }' để lấy ảnh từ danh sách images của sản phẩm, và có thể chọn ảnh đầu tiên.
//   - 'size { size_id, size_name }' và 'color { color_id, name, color_hex }' khớp.
//     - Tương tự, 'color.name' nên dùng resolver ảo nếu cần đa ngôn ngữ.
export const GET_MY_SALE_DETAIL_QUERY = gql`
  query GetMySaleDetail($id: ID!, $lang: String) { # Thêm $lang nếu cần cho tên sản phẩm/màu sắc
    mySaleDetail(id: $id) {
      sale_id
      sale_date
      sale_status
      shipping_name
      shipping_phone
      shipping_address
      shipping_notes
      payment_method
      customer {
        customer_id
        customer_name
        customer_email
        customer_tel
      }
      items {
        sale_item_id
        product_qty
        price_at_sale
        discount_amount
        product_name_at_sale # Tên SP tại thời điểm mua
        # product_sku_at_sale # SKU variant tại thời điểm mua (nếu có)
        product { # Thông tin SP gốc (có thể null nếu SP bị xóa)
          product_id
          name(lang: $lang) # Sử dụng resolver ảo cho tên sản phẩm
          images(limit: 1) { # Lấy ảnh đầu tiên làm đại diện
            image_url
            alt_text(lang: $lang)
          }
        }
        size {
          size_id
          size_name
        }
        color {
          color_id
          name(lang: $lang) # Sử dụng resolver ảo cho tên màu
          color_hex
        }
      }
      totals {
        subtotal_amount
        discount_total
        shipping_fee
        total_amount
      }
      history {
        history_id
        history_date
        history_status
        history_notes
      }
    }
  }
`;

export const GET_MY_SALES_QUERY = gql`
  query GetMySales($limit: Int, $offset: Int, $lang: String) { # Thêm $lang
    mySales(limit: $limit, offset: $offset) {
      count
      sales {
        sale_id
        sale_date
        sale_status
        totals {
          total_amount
        }
        items { # Cân nhắc: nếu resolver Sale.items không hỗ trợ limit, lấy hết và xử lý ở client, hoặc chỉ lấy ID sản phẩm đầu tiên rồi query riêng.
                # Hiện tại, để đơn giản, giả sử lấy hết items và client chọn item đầu.
          product {
            product_id
            name(lang: $lang) # Sử dụng resolver ảo
            images(limit: 1) { # Lấy ảnh đầu tiên
              image_url
              # alt_text(lang: $lang) # Nếu cần alt text ở đây
            }
          }
          # Chỉ cần thông tin sản phẩm của item đầu tiên để hiển thị đại diện
          # Không cần lấy hết các trường của SalesItem ở đây nếu chỉ để hiển thị list.
        }
      }
    }
  }
`;
