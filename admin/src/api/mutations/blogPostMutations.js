// admin-frontend/src/api/graphql/mutations/blogPostMutations.js
import { gql } from '@apollo/client';
import { BLOG_POST_ADMIN_CORE_FIELDS } from '../queries/blogPostQueries';

export const ADMIN_CREATE_BLOG_POST_MUTATION = gql`
  ${BLOG_POST_ADMIN_CORE_FIELDS}
  mutation AdminCreateBlogPost($input: CreateBlogPostAdminInput!) {
    adminCreateBlogPost(input: $input) {
      ...BlogPostAdminCoreFields
    }
  }
`;

export const ADMIN_UPDATE_BLOG_POST_MUTATION = gql`
  ${BLOG_POST_ADMIN_CORE_FIELDS}
  mutation AdminUpdateBlogPost($id: ID!, $input: UpdateBlogPostAdminInput!) {
    adminUpdateBlogPost(id: $id, input: $input) {
      ...BlogPostAdminCoreFields
    }
  }
`;

export const ADMIN_DELETE_BLOG_POST_MUTATION = gql`
  mutation AdminDeleteBlogPost($id: ID!) {
    adminDeleteBlogPost(id: $id)
  }
`;
