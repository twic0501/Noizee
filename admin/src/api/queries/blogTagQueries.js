// admin-frontend/src/api/graphql/queries/blogTagQueries.js
import { gql } from '@apollo/client';

// Fragment này có thể đã được định nghĩa trong blogPostQueries.js
// Nếu vậy, bạn có thể import và sử dụng lại.
// import { BLOG_TAG_SUMMARY_FIELDS } from './blogPostQueries';

// Hoặc định nghĩa lại nếu cần các trường khác
export const BLOG_TAG_DETAIL_FIELDS = gql`
  fragment BlogTagDetailFields on BlogTag {
    tag_id
    name_vi
    name_en
    # name(lang: $lang) # Nếu dùng trường ảo
    slug
    # postCount # Nếu backend có resolver cho trường này
  }
`;

export const ADMIN_GET_ALL_BLOG_TAGS_QUERY = gql`
  ${BLOG_TAG_DETAIL_FIELDS}
  query AdminGetAllBlogTags($lang: String) {
    adminGetAllBlogTags(lang: $lang) {
      ...BlogTagDetailFields
    }
  }
`;

// Query để lấy chi tiết một tag (nếu cần cho trang sửa tag chẳng hạn)
// export const ADMIN_GET_BLOG_TAG_BY_ID_QUERY = gql`
//   ${BLOG_TAG_DETAIL_FIELDS}
//   query AdminGetBlogTagById($id: ID!, $lang: String) {
//     adminGetBlogTagById(id: $id, lang: $lang) { // Giả sử có query này ở backend
//       ...BlogTagDetailFields
//     }
//   }
// `;
