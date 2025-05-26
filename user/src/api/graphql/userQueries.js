import { gql } from '@apollo/client';

// GET_ME_QUERY
// Backend typeDefs: me: CustomerType

export const CUSTOMER_FIELDS_FRAGMENT = gql`
  fragment CustomerFields on Customer { # Hoặc CustomerType tùy theo tên Type trong typeDefs.js
    customer_id # Sử dụng snake_case
    customer_name
    username
    customer_email
    customer_tel
    customer_address
    is_admin # Hoặc isAdmin tùy theo trường trong typeDefs.js và resolver
    virtual_balance
    google_id
    is_active # Thêm trường này nếu có và cần thiết
    created_at
    updated_at
    last_login
  }
`;

export const GET_ME_QUERY = gql`
  query GetMe {
    myProfile { # Giữ nguyên myProfile nếu backend resolver tên là myProfile
      ...CustomerFields
    }
  }
  ${CUSTOMER_FIELDS_FRAGMENT} 
`;