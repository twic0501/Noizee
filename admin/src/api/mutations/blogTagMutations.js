// admin-frontend/src/api/graphql/mutations/blogTagMutations.js
import { gql } from '@apollo/client';

// Fragment cho các trường của BlogTag để dùng chung
export const BLOG_TAG_FIELDS_MUTATION_RESULT = gql`
  fragment BlogTagFieldsMutationResult on BlogTag {
    tag_id
    name_vi
    name_en
    # name(lang: "vi") # Hoặc dùng trường ảo nếu muốn lấy 1 ngôn ngữ cụ thể sau mutation
    slug
  }
`;

export const ADMIN_CREATE_BLOG_TAG_MUTATION = gql`
  ${BLOG_TAG_FIELDS_MUTATION_RESULT}
  mutation AdminCreateBlogTag($input: AdminBlogTagInput!) {
    adminCreateBlogTag(input: $input) {
      ...BlogTagFieldsMutationResult
    }
  }
`;

export const ADMIN_UPDATE_BLOG_TAG_MUTATION = gql`
  ${BLOG_TAG_FIELDS_MUTATION_RESULT}
  mutation AdminUpdateBlogTag($id: ID!, $input: AdminBlogTagInput!) {
    adminUpdateBlogTag(id: $id, input: $input) {
      ...BlogTagFieldsMutationResult
    }
  }
`;

export const ADMIN_DELETE_BLOG_TAG_MUTATION = gql`
  mutation AdminDeleteBlogTag($id: ID!) {
    adminDeleteBlogTag(id: $id) # Trả về boolean
  }
`;
