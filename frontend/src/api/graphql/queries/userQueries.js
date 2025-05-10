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
      # <<< SỬA LẠI: Thêm các trường cần lấy vào đây
      sale_id
      sale_date
      sale_status
      customer { # Lấy thông tin khách hàng
        customer_id
        customer_name
        customer_email
        customer_tel
        customer_address
      }
      items { # Lấy danh sách sản phẩm trong đơn
        sale_item_id # ID của dòng chi tiết (nếu có)
        product_qty
        price_at_sale
        discount_amount
        product { # Lấy thông tin sản phẩm liên quan
          product_id
          product_name
          imageUrl
          # product_price # Có thể lấy giá hiện tại nếu cần
        }
      }
      totals { # Lấy tổng tiền
        total_amount
      }
      history { # Lấy lịch sử trạng thái
        history_id
        history_date
        history_status
        history_notes
      }
      # <<< KẾT THÚC SỬA LẠI
    }
  }
`;

// Query lấy lịch sử đơn hàng của người dùng (Đã sửa lỗi limit trong items)
export const GET_MY_SALES_QUERY = gql`
  query GetMySales($limit: Int, $offset: Int) {
   # Giả định backend đã hỗ trợ pagination cho mySales
   mySales(limit: $limit, offset: $offset) {
      count
      sales {
        sale_id
        sale_date
        sale_status
        totals {
          total_amount
        }
        items { # Không còn limit ở đây
          product {
            product_id
            imageUrl
            product_name
          }
        }
      }
    }
  }
`;