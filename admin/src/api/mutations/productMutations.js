// admin-frontend/src/api/graphql/mutations/productMutations.js
import { gql } from '@apollo/client';
import { PRODUCT_ADMIN_CORE_FIELDS } from '../queries/productQueries';

export const CREATE_PRODUCT_MUTATION = gql`
  # FIXED: Define $lang as an operation variable because PRODUCT_ADMIN_CORE_FIELDS uses it.
  mutation AdminCreateProduct($input: CreateProductAdminInput!, $lang: String) {
    adminCreateProduct(input: $input) {
      # $lang from AdminCreateProduct operation will be in scope for the fragment
      ...ProductAdminCoreFields
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS} 
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  # FIXED: Define $lang as an operation variable because PRODUCT_ADMIN_CORE_FIELDS uses it.
  mutation AdminUpdateProduct($input: UpdateProductAdminInput!, $lang: String) {
    adminUpdateProduct(input: $input) {
      # $lang from AdminUpdateProduct operation will be in scope for the fragment
      ...ProductAdminCoreFields
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS}
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation AdminDeleteProduct($id: ID!) {
    adminDeleteProduct(id: $id)
  }
`;
