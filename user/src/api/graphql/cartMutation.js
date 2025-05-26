import { gql } from '@apollo/client';

// CART_FIELDS_FRAGMENT
// Đảm bảo các Type (CartType, ProductType, ImageType, etc.) và các trường (camelCase)
// khớp với định nghĩa trong backend/graphql/typeDefs.js và cách resolver map dữ liệu.
export const CART_FIELDS_FRAGMENT = gql`
  fragment CartFields on CartType {
    id # ID của giỏ hàng nếu có
    itemCount # Tổng số lượng các mặt hàng (tính theo quantity của từng item)
    subtotal  # Tổng tiền của các item trước discount và shipping
    total     # Tổng tiền cuối cùng phải trả
    discountAmount # Số tiền được giảm giá (nếu có)
    # appliedCoupons { code description discountValue } # Nếu có coupon
    items {
      id # ID của cart item (quan trọng để update/remove)
      quantity
      price # Giá của một đơn vị sản phẩm tại thời điểm thêm vào giỏ
      totalPrice # quantity * price
      product {
        id
        name
        slug
        # price # Giá gốc của sản phẩm, có thể khác với giá trong giỏ nếu giá thay đổi
        # salePrice # Giá bán hiện tại của sản phẩm
        stockQuantity # Để kiểm tra nhanh nếu cần
        images(limit: 1, isPrimary: true) { # Lấy ảnh đại diện
          id
          imageUrl
          altText
        }
        # Thêm các trường khác cần thiết như category.name, brand.name nếu backend schema hỗ trợ
        # category { id name }
      }
      # productVariant { # Nếu bạn sử dụng product variants
      #   id
      #   name # Ví dụ: "Màu Đỏ / Size L"
      #   price # Giá của variant
      #   stockQuantity
      #   image { id imageUrl altText } # Ảnh riêng của variant
      #   attributes { name value }
      # }
    }
  }
`;

// Query để lấy giỏ hàng hiện tại
// Backend typeDefs: getCart: CartType (hoặc CartType!)
export const GET_CART_QUERY = gql`
  query GetCart {
    getCart {
      ...CartFields
    }
  }
  ${CART_FIELDS_FRAGMENT}
`;

// Mutation để thêm sản phẩm vào giỏ
// Backend typeDefs: addToCart(input: AddToCartInput!): CartType!
// AddToCartInput { productId: ID!, productVariantId: ID, quantity: Int! }
export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      ...CartFields
    }
  }
  ${CART_FIELDS_FRAGMENT}
`;

// Mutation để cập nhật số lượng một item trong giỏ
// Backend typeDefs: updateCartItem(input: UpdateCartItemInput!): CartType!
// UpdateCartItemInput { cartItemId: ID!, quantity: Int! }
export const UPDATE_CART_ITEM_MUTATION = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      ...CartFields
    }
  }
  ${CART_FIELDS_FRAGMENT}
`;

// Mutation để xóa một item khỏi giỏ
// Backend typeDefs: removeFromCart(cartItemId: ID!): CartType!
export const REMOVE_FROM_CART_MUTATION = gql`
  mutation RemoveFromCart($cartItemId: ID!) {
    removeFromCart(cartItemId: $cartItemId) {
      ...CartFields
    }
  }
  ${CART_FIELDS_FRAGMENT}
`;

// Mutation để xóa toàn bộ giỏ hàng
// Backend typeDefs: clearCart: CartType!
export const CLEAR_CART_MUTATION = gql`
  mutation ClearCart {
    clearCart {
      ...CartFields
    }
  }
  ${CART_FIELDS_FRAGMENT}
`;

// Mutation để áp dụng mã giảm giá (ví dụ)
// Backend typeDefs: applyCoupon(couponCode: String!): CartType!
// export const APPLY_COUPON_MUTATION = gql`
//   mutation ApplyCoupon($couponCode: String!) {
//     applyCoupon(couponCode: $couponCode) {
//       ...CartFields
//     }
//   }
//   ${CART_FIELDS_FRAGMENT}
// `;

// Mutation để gỡ mã giảm giá (ví dụ)
// Backend typeDefs: removeCoupon(couponId: ID!): CartType! (hoặc couponCode)
// export const REMOVE_COUPON_MUTATION = gql`
//   mutation RemoveCoupon($couponId: ID!) {
//     removeCoupon(couponId: $couponId) {
//       ...CartFields
//     }
//   }
//   ${CART_FIELDS_FRAGMENT}
// `;