// user/src/api/graphql/userMutations.js
import { gql } from '@apollo/client';
import { CUSTOMER_FIELDS_FRAGMENT } from './userQueries'; // Giả sử bạn có fragment này trong userQueries.js

// Input type cho cập nhật profile (phải khớp với backend typeDefs)
// input UpdateUserProfileInput {
//   firstName: String
//   lastName: String
//   phoneNumber: String
//   address: String
//   // Không cho phép đổi email ở đây, hoặc cần quy trình xác thực riêng
// }
export const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) { # Tên mutation phải khớp backend
      ...CustomerFields # Trả về thông tin user đã cập nhật
    }
  }
  ${CUSTOMER_FIELDS_FRAGMENT} # Đảm bảo fragment này được định nghĩa và import
`;

// CUSTOMER_FIELDS_FRAGMENT (ví dụ, đặt trong userQueries.js hoặc một file fragments chung)
// export const CUSTOMER_FIELDS_FRAGMENT = gql`
//   fragment CustomerFields on CustomerType {
//     id
//     firstName
//     lastName
//     email
//     phoneNumber
//     address
//     role
//     isActive
//   }
// `;

// Mutation để thay đổi mật khẩu (nếu có form riêng)
// input ChangePasswordInput { currentPassword: String!, newPassword: String! }
// export const CHANGE_PASSWORD_MUTATION = gql`
//  mutation ChangePassword($input: ChangePasswordInput!) {
//    changePassword(input: $input) { # Backend có thể trả về message hoặc user
//      id # Hoặc một message thành công
//      message
//    }
//  }
// `;