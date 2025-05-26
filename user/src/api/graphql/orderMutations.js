// user/src/api/graphql/orderMutations.js (hoặc saleMutations.js)
import { gql } from '@apollo/client';
// Import các fragment nếu cần, ví dụ OrderSummaryFields nếu backend trả về order sau khi tạo

// Input type cho việc tạo đơn hàng (phải khớp với backend typeDefs)
// input CreateOrderInput {
//   shippingAddress: AddressInput!
//   billingAddress: AddressInput # Nếu khác shipping address
//   shippingMethodId: ID!
//   paymentMethodId: ID! # Hoặc paymentMethodNonce/Token từ cổng thanh toán
//   notes: String
//   // cartId: ID! // Backend có thể tự lấy cart của user hiện tại
//   // couponCode: String
// }
// input AddressInput {
//   firstName: String!
//   lastName: String!
//   phoneNumber: String!
//   street: String!
//   ward: String // hoặc wardId
//   district: String // hoặc districtId
//   city: String // hoặc cityId
//   country: String!
//   isDefaultShipping: Boolean
//   isDefaultBilling: Boolean
// }

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) { # Tên mutation phải khớp backend
      id # ID của đơn hàng vừa tạo
      order_number
      status
      total_amount
      # Thêm các trường khác của SaleType bạn muốn nhận lại ngay
      # ...OrderSummaryFields 
    }
  }
  # ${ORDER_SUMMARY_FIELDS_FRAGMENT} // Nếu dùng fragment
`;