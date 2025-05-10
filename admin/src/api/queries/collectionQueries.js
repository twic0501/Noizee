import { gql } from '@apollo/client';


export const ADMIN_GET_ALL_COLLECTIONS_QUERY = gql`
  query AdminGetAllCollections {
    adminGetAllCollections { # Hoặc tên query bạn đã định nghĩa
      collection_id
      collection_name
      collection_description
      slug
      # Có thể thêm count số lượng sản phẩm nếu backend hỗ trợ
      # productCount
    }
  }
`;

