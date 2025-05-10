import { gql } from '@apollo/client';


export const GET_ADMIN_USERS_QUERY = gql`
  query AdminGetAllUsers($limit: Int, $offset: Int) {
    adminGetAllUsers(limit: $limit, offset: $offset) {
      count
      users {
        customer_id
        customer_name
        customer_email
        customer_tel
        isAdmin
        virtual_balance
        customer_address # Thêm nếu cần hiển thị
        # googleId # Có thể thêm nếu cần biết user liên kết Google
      }
    }
  }
`;