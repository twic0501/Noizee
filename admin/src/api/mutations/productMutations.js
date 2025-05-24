// admin-frontend/src/api/graphql/mutations/productMutations.js
import { gql } from '@apollo/client';
// Import the updated fragment
import { PRODUCT_ADMIN_CORE_FIELDS } from '../queries/productQueries';

export const CREATE_PRODUCT_MUTATION = gql`
  mutation AdminCreateProduct($input: CreateProductAdminInput!, $lang: String) {
    adminCreateProduct(input: $input) { # lang is not directly passed to adminCreateProduct resolver based on typeDefs
      ...ProductAdminCoreFields # $lang from the operation will be available to the fragment's field resolvers
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS}
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation AdminUpdateProduct($input: UpdateProductAdminInput!, $lang: String) {
    adminUpdateProduct(input: $input) { # lang is not directly passed to adminUpdateProduct resolver based on typeDefs
      ...ProductAdminCoreFields # $lang from the operation will be available to the fragment's field resolvers
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS}
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation AdminDeleteProduct($id: ID!) {
    adminDeleteProduct(id: $id) # Returns Boolean
  }
`;
