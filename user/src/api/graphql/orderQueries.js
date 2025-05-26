// user/src/api/graphql/orderQueries.js (Nội dung mới)
import { gql } from '@apollo/client';

// Fragment cho các trường cơ bản của một Order Item
export const ORDER_ITEM_FIELDS_FRAGMENT = gql`
  fragment OrderItemFields on SalesItemType { # Đảm bảo SalesItemType là tên đúng
    id
    product_name # Hoặc product { id name slug images { imageUrl } } nếu muốn chi tiết hơn
    quantity
    price_per_unit
    total_price
    # product_id # Nếu có
    # product_image_url # Nếu có
  }
`;

// Fragment cho các trường cơ bản của một Order
export const ORDER_SUMMARY_FIELDS_FRAGMENT = gql`
  fragment OrderSummaryFields on SaleType { # Đảm bảo SaleType là tên đúng
    id
    sale_date
    total_amount
    status
    # order_number # Nếu có
    # item_count 
  }
`;

// Query để lấy danh sách đơn hàng của người dùng hiện tại (phân trang)
export const GET_MY_ORDERS_QUERY = gql`
  query GetMyOrders($limit: Int, $offset: Int, $sortBy: String, $sortOrder: String) {
    myOrders(limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
      # Backend có thể trả về một payload chứa orders và totalCount
      # Ví dụ:
      # orders {
      #   ...OrderSummaryFields
      # }
      # totalCount
      # Nếu trả về mảng SaleType[] trực tiếp:
      ...OrderSummaryFields
    }
  }
  ${ORDER_SUMMARY_FIELDS_FRAGMENT}
`;

// Query để lấy chi tiết một đơn hàng
export const GET_ORDER_DETAILS_QUERY = gql`
  query GetOrderDetails($orderId: ID!) {
    myOrder(id: $orderId) { # Hoặc order(id: $orderId) nếu query ở backend tên là 'order'
      ...OrderSummaryFields
      customer_id # Hoặc customer { id firstName lastName email }
      # shipping_address { street city postalCode country }
      # billing_address { street city postalCode country }
      # payment_method
      # shipping_method
      # discount_amount
      # subtotal_amount
      # tax_amount
      items { # Danh sách các sản phẩm trong đơn hàng
        ...OrderItemFields
      }
      # history { status timestamp notes } # Lịch sử trạng thái đơn hàng
    }
  }
  ${ORDER_SUMMARY_FIELDS_FRAGMENT}
  ${ORDER_ITEM_FIELDS_FRAGMENT}
`;