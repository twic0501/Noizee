// admin-frontend/src/api/graphql/queries/colorQueries.js
import { gql } from '@apollo/client';

// Query không cần biến lang nếu resolver Color.name không dùng đến
// và model Color chỉ có một trường color_name
export const ADMIN_GET_ALL_COLORS_QUERY = gql`
  query AdminGetAllColors { # Bỏ $lang nếu không dùng
    adminGetAllColors { # Bỏ (lang: $lang) nếu không dùng
      color_id
      color_name # Yêu cầu trường color_name gốc từ DB
      color_hex
      name # Yêu cầu trường ảo 'name' (resolver sẽ trả về color_name)
    }
  }
`;

export const PUBLIC_GET_ALL_COLORS_QUERY = gql`
  query PublicGetAllColors { # Bỏ $lang nếu không dùng
    publicGetAllColors { # Bỏ (lang: $lang) nếu không dùng
      color_id
      color_name
      color_hex
      name
    }
  }
`;
