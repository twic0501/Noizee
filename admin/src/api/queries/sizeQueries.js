import { gql } from '@apollo/client';


export const ADMIN_CREATE_SIZE_MUTATION = gql` 
  mutation AdminCreateSize($name: String!) {
    adminCreateSize(name: $name) {
      size_id
      size_name
    }
  }
`;
export const GET_ALL_SIZES_QUERY = gql`
  query AdminGetAllSizes { # Hoặc tên query bạn dùng ở backend
    adminGetAllSizes { # Hoặc sizes (tên field trả về từ backend)
      size_id
      size_name
    }
  }
`;
export const ADMIN_UPDATE_SIZE_MUTATION = gql` 
  mutation AdminUpdateSize($id: ID!, $name: String!) {
    adminUpdateSize(id: $id, name: $name) {
      size_id
      size_name
    }
  }
`;

export const ADMIN_DELETE_SIZE_MUTATION = gql` 
  mutation AdminDeleteSize($id: ID!) {
    adminDeleteSize(id: $id)
  }
`;