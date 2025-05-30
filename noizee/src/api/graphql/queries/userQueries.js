import { gql } from '@apollo/client';
import { USER_INFO_FIELDS, CORE_ORDER_FIELDS } from '../fragments';

export const GET_ME = gql`
  query GetMe {
    me {
      ...UserInfoFields
      # Bạn có thể muốn lấy một vài đơn hàng gần nhất ở đây
      # orderHistory(limit: 5, sort: { field: createdAt, direction: DESC }) {
      #   items {
      #     ...CoreOrderFields
      #   }
      # }
    }
  }
  ${USER_INFO_FIELDS}
  # ${CORE_ORDER_FIELDS} // Bỏ comment nếu dùng orderHistory
`;

// Query để lấy lịch sử đơn hàng của user (có pagination)
export const GET_MY_ORDERS = gql`
  query GetMyOrders($limit: Int, $offset: Int, $after: String) {
    myOrders(limit: $limit, offset: $offset, after: $after) { # Tên query này tùy thuộc backend
      items {
        ...CoreOrderFields
        # Thêm các trường chi tiết hơn nếu cần cho danh sách đơn hàng
        # Example: itemCount, firstItemImage
      }
      totalCount
      pageInfo {
          hasNextPage
          endCursor
      }
    }
  }
  ${CORE_ORDER_FIELDS}
`;