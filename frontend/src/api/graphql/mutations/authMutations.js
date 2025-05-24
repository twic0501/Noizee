// src/api/graphql/mutations/authMutations.js
import { gql } from '@apollo/client';

// Mutation đăng nhập
// Đồng bộ hóa: Tên mutation 'login', các biến đầu vào '$identifier', '$password'
// và các trường trả về trong 'AuthPayload' khớp với backend 'typeDefs.js' và 'resolvers.js'.
// Backend resolver 'login' nhận 'identifier' và 'customer_password'. Frontend gửi đúng như vậy.
export const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, customer_password: $password) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance # Đã có trong AuthPayload của backend
    }
  }
`;

// Mutation đăng ký
// Đồng bộ hóa: Tên mutation 'register', biến đầu vào '$input' (kiểu RegisterInput!)
// và các trường trả về trong 'AuthPayload' khớp với backend.
// Backend resolver 'register' nhận 'input' và xử lý.
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance # Đã có trong AuthPayload của backend
    }
  }
`;

// Mutation yêu cầu quên mật khẩu
// Đồng bộ hóa: Tên mutation 'forgotPassword', biến đầu vào '$email'
// và các trường trả về ('success', 'message') trong 'ForgotPasswordPayload' khớp với backend.
export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

// Mutation đặt lại mật khẩu
// Đồng bộ hóa: Tên mutation 'resetPassword', các biến đầu vào '$token', '$newPassword'
// và các trường trả về ('success', 'message', 'token', 'customer') trong 'ResetPasswordPayload' khớp với backend.
// Backend resolver 'resetPassword' nhận 'token' và 'newPassword'.
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
      token      # Token đăng nhập mới (nếu backend trả về)
      customer { # Thông tin user (nếu backend trả về)
        customer_id
        customer_name
        username
        customer_email
        # Bạn có thể thêm các trường khác của Customer nếu backend trả về và frontend cần
      }
    }
  }
`;