import { gql } from '@apollo/client';
import { BLOG_COMMENT_FIELDS_FRAGMENT } from './blogQueries'; // Import fragment nếu cần

// Mutation để thêm bình luận vào một bài viết
// Backend typeDefs: createBlogComment(input: CreateBlogCommentInput!): BlogCommentType!
// CreateBlogCommentInput { postId: ID!, content: String!, parentCommentId: ID }
export const CREATE_BLOG_COMMENT_MUTATION = gql`
  mutation CreateBlogComment($input: CreateBlogCommentInput!) {
    createBlogComment(input: $input) {
      ...BlogCommentFields
    }
  }
  ${BLOG_COMMENT_FIELDS_FRAGMENT}
`;

// Mutation để cập nhật bình luận (nếu có)
// export const UPDATE_BLOG_COMMENT_MUTATION = gql`
//   mutation UpdateBlogComment($commentId: ID!, $content: String!) {
//     updateBlogComment(commentId: $commentId, content: $content) {
//       ...BlogCommentFields
//     }
//   }
//   ${BLOG_COMMENT_FIELDS_FRAGMENT}
// `;

// Mutation để xóa bình luận (nếu có)
// export const DELETE_BLOG_COMMENT_MUTATION = gql`
//   mutation DeleteBlogComment($commentId: ID!) {
//     deleteBlogComment(commentId: $commentId) # Thường trả về ID hoặc Boolean
//   }
// `;