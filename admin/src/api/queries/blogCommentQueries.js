// admin-frontend/src/api/graphql/queries/blogCommentQueries.js
import { gql } from '@apollo/client';
// Import BLOG_AUTHOR_FIELDS từ blogPostQueries nếu đã định nghĩa ở đó
import { BLOG_AUTHOR_FIELDS } from './blogPostQueries';

export const BLOG_COMMENT_ITEM_FIELDS = gql`
  ${BLOG_AUTHOR_FIELDS}
  fragment BlogCommentItemFields on BlogComment {
    comment_id
    post_id # Để biết comment thuộc bài viết nào
    content
    status
    created_at
    updated_at
    parent_comment_id
    author {
      ...BlogAuthorFields
    }
    # replies (có thể fetch riêng hoặc fetch một vài level đầu)
    # replies(limit: 3, offset: 0) {
    #   count
    #   comments {
    #     comment_id
    #     content
    #     author { ...BlogAuthorFields }
    #     created_at
    #   }
    # }
  }
`;

export const ADMIN_GET_ALL_BLOG_COMMENTS_QUERY = gql`
  ${BLOG_COMMENT_ITEM_FIELDS}
  query AdminGetAllBlogComments($post_id: ID, $filter_status: String, $limit: Int, $offset: Int) {
    adminGetAllBlogComments(post_id: $post_id, filter_status: $filter_status, limit: $limit, offset: $offset) {
      count
      comments {
        ...BlogCommentItemFields
        # Lấy thêm thông tin bài viết nếu cần cho context
        # post {
        #   post_id
        #   title_vi # Hoặc title(lang: "vi")
        # }
      }
    }
  }
`;

// Query để lấy replies cho một comment cụ thể (nếu cần fetch riêng)
// export const GET_BLOG_COMMENT_REPLIES_QUERY = gql`
//   ${BLOG_COMMENT_ITEM_FIELDS}
//   query GetBlogCommentReplies($comment_id: ID!, $limit: Int, $offset: Int) {
//     blogComment(comment_id: $comment_id) { # Giả sử có query lấy 1 comment
//       replies(limit: $limit, offset: $offset) {
//         count
//         comments {
//           ...BlogCommentItemFields
//         }
//       }
//     }
//   }
// `;
