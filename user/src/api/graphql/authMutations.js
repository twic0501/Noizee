import { gql } from '@apollo/client';

// LOGIN_USER_MUTATION
// Backend typeDefs: loginUser(email: String!, password: String!): AuthPayload
// AuthPayload { token: String!, user: CustomerType! }
// CustomerType fields (camelCase from typeDefs, mapped in Customer resolver):
// id, firstName, lastName, email, role, phoneNumber, address, isActive, createdAt, updatedAt, lastLogin
export const LOGIN_USER_MUTATION = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        firstName
        lastName
        email
        role
        phoneNumber
        address
        isActive
        # Không cần lấy createdAt, updatedAt, lastLogin ở đây trừ khi thực sự cần ngay sau login
      }
    }
  }
`;

// REGISTER_USER_MUTATION
// Backend typeDefs: registerUser(input: RegisterUserInput!): AuthPayload
// RegisterUserInput { firstName!, lastName!, email!, password!, phoneNumber, address }
export const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
      user {
        id
        firstName
        lastName
        email
        role
        # Các trường khác nếu cần ngay sau đăng ký
      }
    }
  }
`;

// REQUEST_PASSWORD_RESET_MUTATION
// Backend typeDefs: requestPasswordReset(email: String!): String
export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) # Trả về message
  }
`;

// RESET_PASSWORD_MUTATION
// Backend typeDefs: resetPassword(token: String!, newPassword: String!): AuthPayload
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      token # Giả sử backend trả về AuthPayload để tự động đăng nhập
      user {
        id
        firstName
        lastName
        email
        role
      }
    }
  }
`;