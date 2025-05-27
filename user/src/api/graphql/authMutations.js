import { gql } from '@apollo/client';

// LOGIN_USER_MUTATION
// Backend typeDefs: login(identifier: String!, customer_password: String!): AuthPayload
// AuthPayload { token, customer_id, customer_name, username, customer_email, isAdmin, virtual_balance }
export const LOGIN_USER_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, customer_password: $password) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance
    }
  }
`;

// REGISTER_USER_MUTATION
// Backend typeDefs: register(input: RegisterInput!): AuthPayload
// RegisterInput { username?, customer_name!, customer_email!, customer_password!, customer_tel!, customer_address? }
export const REGISTER_USER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance
    }
  }
`;

// REQUEST_PASSWORD_RESET_MUTATION
// Backend typeDefs: forgotPassword(email: String!): ForgotPasswordPayload
export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

// RESET_PASSWORD_MUTATION
// Backend typeDefs: resetPassword(token: String!, newPassword: String!): ResetPasswordPayload
// ResetPasswordPayload includes success, message, and optionally token and customer details for auto-login.
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
      token # For auto-login
      customer { # Assuming backend's ResetPasswordPayload.customer provides these fields
        customer_id
        customer_name
        username
        customer_email
        isAdmin
        # virtual_balance # Potentially include if backend sends it upon reset
      }
    }
  }
`;