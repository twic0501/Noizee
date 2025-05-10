import { gql } from '@apollo/client';

const ORDER_LIST_FIELDS = gql`
  fragment OrderListFields on Sale {
      sale_id
      sale_date
      sale_status
      customer {
        customer_id
        customer_name
        customer_email
      }
      totals {
        total_amount
      }
  }
`;

n
export const GET_ADMIN_SALES_QUERY = gql`
  ${ORDER_LIST_FIELDS}
  query AdminGetAllSales($limit: Int, $offset: Int, $filter: AdminSaleFilterInput) {
    adminGetAllSales(limit: $limit, offset: $offset, filter: $filter) {
      count
      sales {
          ...OrderListFields
      }
    }
  }
`;


export const GET_ADMIN_SALE_DETAILS_QUERY = gql`
  ${ORDER_LIST_FIELDS}
  query AdminGetSaleDetails($id: ID!) {
    adminGetSaleDetails(id: $id) {
      ...OrderListFields # Lấy các trường cơ bản
      items { # Chi tiết các món hàng
        sale_item_id
        product_qty
        price_at_sale
        discount_amount
        product {
          product_id
          product_name
          imageUrl
        }
      }
      history { # Lịch sử trạng thái
        history_id
        history_date # Đảm bảo schema trả về DateTimeString
        history_status
        history_notes
      }
      # Thông tin customer đầy đủ hơn nếu cần trong chi tiết
      customer {
          customer_id
          customer_name
          customer_email
          customer_tel
          customer_address
      }
    }
  }
`;