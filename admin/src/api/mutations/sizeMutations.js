import { gql } from '@apollo/client';

export const ADMIN_CREATE_SIZE_MUTATION = gql`
  mutation AdminCreateSize($name: String!) {
    adminCreateSize(name: $name) { # Giả định mutation trả về Size mới
      size_id
      size_name
    }
  }
`;

export const ADMIN_UPDATE_SIZE_MUTATION = gql`
  mutation AdminUpdateSize($id: ID!, $name: String!) {
    adminUpdateSize(id: $id, name: $name) { # Giả định mutation trả về Size đã cập nhật
      size_id
      size_name
    }
  }
`;

export const ADMIN_DELETE_SIZE_MUTATION = gql`
  mutation AdminDeleteSize($id: ID!) {
    adminDeleteSize(id: $id) # Giả định mutation trả về boolean
  }
`;