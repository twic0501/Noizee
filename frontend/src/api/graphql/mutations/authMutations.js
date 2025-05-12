// src/api/graphql/mutations/authMutations.js
import { gql } from '@apollo/client';

// Mutation đăng nhập (trả về AuthPayload)
export const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, customer_password: $password) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance # Lấy số dư ảo khi đăng nhập
    }
  }
`;

// Mutation đăng ký (input là RegisterInput, trả về AuthPayload)
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance # Lấy số dư ảo khi đăng ký
    }
  }
`;

// Mutation yêu cầu quên mật khẩu
export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

// Mutation đặt lại mật khẩu
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
      token      # Token đăng nhập mới nếu có
      customer { # Thông tin user nếu có
        customer_id
        customer_name
        # ... các trường khác cần thiết
      }
    }
  }
`;