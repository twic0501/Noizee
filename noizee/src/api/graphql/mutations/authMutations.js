import { gql } from '@apollo/client';
import { USER_INFO_FIELDS } from '../fragments';

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) { # Tên mutation này tùy thuộc backend
      token
      user {
        ...UserInfoFields
      }
      # errors { field, message } # Nếu backend trả về lỗi cụ thể
    }
  }
  ${USER_INFO_FIELDS}
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
    register(input: { firstName: $firstName, lastName: $lastName, email: $email, password: $password }) { # Input có thể là object
      token
      user {
        ...UserInfoFields
      }
      # errors { field, message }
    }
  }
  ${USER_INFO_FIELDS}
`;

// Mutation cho Forgot Password và Reset Password (cần backend hỗ trợ)
export const FORGOT_PASSWORD = gql`
    mutation ForgotPassword($email: String!) {
        forgotPassword(email: $email) {
            success # Hoặc một message
            message
        }
    }
`;

export const RESET_PASSWORD = gql`
    mutation ResetPassword($token: String!, $newPassword: String!) {
        resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
            # Có thể trả về token và user mới nếu muốn tự động đăng nhập
            # token
            # user { ...UserInfoFields }
        }
    }
    # ${USER_INFO_FIELDS} // Nếu có trả về user
`;