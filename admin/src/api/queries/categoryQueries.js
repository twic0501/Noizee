// admin-frontend/src/api/graphql/queries/categoryQueries.js
import { gql } from '@apollo/client';

export const ADMIN_GET_ALL_CATEGORIES_QUERY = gql`
  query AdminGetAllCategories($lang: String) { # Thêm biến lang
    adminGetAllCategories(lang: $lang) { # Truyền lang cho backend
      category_id
      category_name_vi # Lấy trực tiếp
      category_name_en # Lấy trực tiếp
      name(lang: $lang) # Hoặc dùng trường ảo (nếu có Type Resolver)
    }
  }
`;

// Nếu bạn có query lấy 1 category:
// export const ADMIN_GET_CATEGORY_DETAILS_QUERY = gql`
//   query AdminGetCategoryDetails($id: ID!, $lang: String) {
//     adminGetCategoryById(id: $id, lang: $lang) { // Giả sử có query này ở backend
//       category_id
//       category_name_vi
//       category_name_en
//       name(lang: $lang)
//     }
//   }
// `;
