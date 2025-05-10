import { gql } from '@apollo/client';

export const ADMIN_CREATE_CATEGORY_MUTATION = gql`
  mutation AdminCreateCategory($name: String!) {
    adminCreateCategory(name: $name) { # Giả định mutation trả về Category mới
      category_id
      category_name
    }
  }
`;

export const ADMIN_UPDATE_CATEGORY_MUTATION = gql`
  mutation AdminUpdateCategory($id: ID!, $name: String!) {
    adminUpdateCategory(id: $id, name: $name) { # Giả định mutation trả về Category đã cập nhật
      category_id
      category_name
    }
  }
`;

export const ADMIN_DELETE_CATEGORY_MUTATION = gql`
  mutation AdminDeleteCategory($id: ID!) {
    adminDeleteCategory(id: $id) # Giả định mutation trả về boolean
  }
`;