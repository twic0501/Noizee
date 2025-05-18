// admin-frontend/src/api/graphql/mutations/categoryMutations.js
import { gql } from '@apollo/client';

export const ADMIN_CREATE_CATEGORY_MUTATION = gql`
  mutation AdminCreateCategory($input: AdminCategoryInput!) { # Sử dụng AdminCategoryInput từ schema
    adminCreateCategory(input: $input) {
      category_id
      category_name_vi # Lấy cả hai ngôn ngữ để có thể hiển thị/kiểm tra
      category_name_en
      name(lang: "vi") # Hoặc lấy trường ảo nếu bạn muốn xử lý ngôn ngữ ở client ít hơn
      # name(lang: "en")
    }
  }
`;

export const ADMIN_UPDATE_CATEGORY_MUTATION = gql`
  mutation AdminUpdateCategory($id: ID!, $input: AdminCategoryInput!) { # Sử dụng AdminCategoryInput
    adminUpdateCategory(id: $id, input: $input) {
      category_id
      category_name_vi
      category_name_en
      name(lang: "vi")
      # name(lang: "en")
    }
  }
`;

export const ADMIN_DELETE_CATEGORY_MUTATION = gql`
  mutation AdminDeleteCategory($id: ID!) {
    adminDeleteCategory(id: $id)
  }
`;
