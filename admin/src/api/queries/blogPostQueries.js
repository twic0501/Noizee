// admin-frontend/src/api/graphql/queries/blogPostQueries.js
import { gql } from '@apollo/client';

// Fragment cho các trường của BlogTag khi lấy kèm BlogPost
export const BLOG_TAG_SUMMARY_FIELDS = gql`
  fragment BlogTagSummaryFields on BlogTag {
    tag_id
    name_vi
    name_en
    # name(lang: $lang) # Nếu dùng trường ảo và truyền lang
    slug
  }
`;

// Fragment cho các trường của BlogAuthor
export const BLOG_AUTHOR_FIELDS = gql`
  fragment BlogAuthorFields on BlogAuthor {
    customer_id
    customer_name
    username
  }
`;

// Fragment cho các trường cốt lõi của BlogPost
export const BLOG_POST_ADMIN_CORE_FIELDS = gql`
  ${BLOG_TAG_SUMMARY_FIELDS}
  ${BLOG_AUTHOR_FIELDS}
  fragment BlogPostAdminCoreFields on BlogPost {
    post_id
    title_vi
    title_en
    # title(lang: $lang)
    excerpt_vi
    excerpt_en
    # excerpt(lang: $lang)
    content_html_vi # Admin có thể cần xem/sửa cả hai
    content_html_en
    slug
    featured_image_url
    status
    visibility
    allow_comments
    template_key
    meta_title_vi
    meta_title_en
    meta_description_vi
    meta_description_en
    published_at
    created_at
    updated_at
    author {
      ...BlogAuthorFields
    }
    tags {
      ...BlogTagSummaryFields
    }
    # comments (có thể không lấy hết comments ở list, chỉ lấy ở trang chi tiết)
  }
`;

export const ADMIN_GET_ALL_BLOG_POSTS_QUERY = gql`
  ${BLOG_POST_ADMIN_CORE_FIELDS}
  query AdminGetAllBlogPosts($filter: BlogPostFilterInput, $limit: Int, $offset: Int, $lang: String) {
    adminGetAllBlogPosts(filter: $filter, limit: $limit, offset: $offset, lang: $lang) {
      count
      posts {
        ...BlogPostAdminCoreFields
      }
    }
  }
`;

export const ADMIN_GET_BLOG_POST_BY_ID_QUERY = gql`
  ${BLOG_POST_ADMIN_CORE_FIELDS}
  # Fragment cho comments nếu muốn lấy ở đây
  query AdminGetBlogPostById($id: ID!, $lang: String) {
    adminGetBlogPostById(id: $id, lang: $lang) {
      ...BlogPostAdminCoreFields
      # Có thể lấy thêm comments ở đây nếu cần cho trang edit
      # comments(limit: 10, offset: 0) {
      #   count
      #   comments {
      #     comment_id
      #     content
      #     status
      #     created_at
      #     author { ...BlogAuthorFields }
      #   }
      # }
    }
  }
`;
