// src/api/graphql/queries/userQueries.js
import { gql } from '@apollo/client';

// Query lấy thông tin profile người dùng hiện tại
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
export const GET_MY_SALE_DETAIL_QUERY = gql`
  query GetMySaleDetail($id: ID!) {
    mySaleDetail(id: $id) {
      sale_id
      sale_date
      sale_status
      shipping_name # Thêm các trường giao hàng nếu bạn lưu ở bảng Sales
      shipping_phone
      shipping_address
      shipping_notes
      payment_method
      customer {
        customer_id
        customer_name
        customer_email
        customer_tel
        # customer_address # Có thể lấy từ shipping_address của đơn hàng
      }
      items {
        sale_item_id
        product_qty
        price_at_sale
        discount_amount
        product_name_at_sale # Tên SP tại thời điểm mua
        product_sku_at_sale # SKU variant tại thời điểm mua (nếu có)
        product { # Thông tin SP gốc (có thể null nếu SP bị xóa)
          product_id
          product_name
          imageUrl
        }
        size { # Thông tin size đã chọn (có thể null)
          size_id
          size_name
        }
        color { # Thông tin color đã chọn (có thể null)
          color_id
          color_name
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

// Query lấy lịch sử đơn hàng của người dùng
export const GET_MY_SALES_QUERY = gql`
  query GetMySales($limit: Int, $offset: Int) {
    mySales(limit: $limit, offset: $offset) {
      count
      sales {
        sale_id
        sale_date
        sale_status
        totals {
          total_amount
        }
        # Lấy item đầu tiên để hiển thị ảnh đại diện (ví dụ)
        items(limit: 1) { # Nếu resolver hỗ trợ limit cho items
          product {
            product_id
            imageUrl
            product_name
          }
        }
        # Hoặc nếu items không hỗ trợ limit, bạn có thể lấy hết và xử lý ở frontend:
        # items {
        #   product { product_id imageUrl product_name }
        # }
      }
    }
  }
`;