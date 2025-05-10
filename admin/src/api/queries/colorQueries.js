import { gql } from '@apollo/client';


export const ADMIN_GET_ALL_COLORS_QUERY = gql`
  query AdminGetAllColors {
    adminGetAllColors { # Tên query này phải khớp với schema GraphQL của bạn
      color_id
      color_name
      color_hex
    }
  }
`;

