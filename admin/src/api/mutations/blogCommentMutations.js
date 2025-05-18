// admin-frontend/src/api/graphql/mutations/blogCommentMutations.js
import { gql } from '@apollo/client';
import { BLOG_AUTHOR_FIELDS } from '../queries/blogPostQueries'; // Giả sử fragment này đã được định nghĩa

// Fragment cho BlogComment để dùng chung trong kết quả mutation
export const BLOG_COMMENT_FIELDS_MUTATION_RESULT = gql`
  ${BLOG_AUTHOR_FIELDS}
  fragment BlogCommentFieldsMutationResult on BlogComment {
    comment_id
    post_id
    content
    status
    created_at
    updated_at
    parent_comment_id
    author {
      ...BlogAuthorFields
    }
    # replies (thường không lấy replies ngay sau khi mutate comment cha)
  }
`;

export const ADMIN_APPROVE_BLOG_COMMENT_MUTATION = gql`
  ${BLOG_COMMENT_FIELDS_MUTATION_RESULT}
  mutation AdminApproveBlogComment($comment_id: ID!) {
    adminApproveBlogComment(comment_id: $comment_id) {
      ...BlogCommentFieldsMutationResult
    }
  }
`;

export const ADMIN_REJECT_BLOG_COMMENT_MUTATION = gql`
  ${BLOG_COMMENT_FIELDS_MUTATION_RESULT}
  mutation AdminRejectBlogComment($comment_id: ID!) {
    adminRejectBlogComment(comment_id: $comment_id) {
      ...BlogCommentFieldsMutationResult
    }
  }
`;

export const ADMIN_DELETE_BLOG_COMMENT_MUTATION = gql`
  mutation AdminDeleteBlogComment($comment_id: ID!) {
    adminDeleteBlogComment(comment_id: $comment_id) # Trả về boolean
  }
`;

// Mutation cho người dùng tạo bình luận (nếu admin có chức năng này hoặc để tham khảo)
// Thường thì mutation này sẽ được dùng ở frontend của người dùng cuối.
export const CREATE_BLOG_COMMENT_MUTATION = gql`
  ${BLOG_COMMENT_FIELDS_MUTATION_RESULT}
  mutation CreateBlogComment($input: CreateBlogCommentInput!) {
    createBlogComment(input: $input) {
      ...BlogCommentFieldsMutationResult
    }
  }
`;
