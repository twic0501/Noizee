// src/api/mutations/authMutations.js
import { gql } from '@apollo/client';

export const ADMIN_LOGIN_MUTATION = gql` 
  mutation LoginAdmin($identifier: String!, $password: String!) {
    login(identifier: $identifier, customer_password: $password) {
      token
      isAdmin
      customer_id
      customer_name
      username
      customer_email
    }
  }
`;