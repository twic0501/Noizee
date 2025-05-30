// src/api/graphql/fragments.js
import { gql } from '@apollo/client';

export const IMAGE_FIELDS = gql`
  fragment ImageFields on ProductImage { # Hoặc tên Type Image của bạn
    id
    url
    altText
    isDefault
    # Thêm các kích thước khác nếu có (thumbnail, medium, large)
    # main: url(transform: { width: 400, height: 500 }) # Ví dụ nếu backend hỗ trợ transform
    # thumbnail: url(transform: { width: 80, height: 100 })
  }
`;

export const COLOR_FIELDS = gql`
  fragment ColorFields on Color {
    id
    name
    hex
    images { # Giả sử mỗi màu có thể có bộ ảnh riêng
      main
      hover
      thumbnails
    }
  }
`;

export const SIZE_FIELDS = gql`
  fragment SizeFields on Size {
    id
    name
    # description
  }
`;

export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id
    name
    slug
    # description
    # imageUrl
    # parent { id, name } # Nếu có danh mục cha
  }
`;

export const COLLECTION_FIELDS = gql`
  fragment CollectionFields on Collection {
    id
    name
    slug
    # description
    # imageUrl
  }
`;

export const CORE_PRODUCT_FIELDS = gql`
  fragment CoreProductFields on Product {
    id
    name
    slug
    price
    # oldPrice # Hoặc salePrice
    # isOnSale
    # averageRating
    # reviewCount
    defaultColorId # Để tiện lấy ảnh mặc định từ availableColors
    category {
      ...CategoryFields
    }
    availableColors {
      ...ColorFields
    }
    # Chỉ lấy thumbnail hoặc một ảnh chính cho product card
    # mainImage { ...ImageFields } # Nếu có một trường riêng cho ảnh chính của sản phẩm
    # Hoặc logic chọn ảnh từ availableColors[0].images.main
  }
  ${CATEGORY_FIELDS}
  ${COLOR_FIELDS}
  # ${IMAGE_FIELDS} // Nếu dùng mainImage
`;

export const PRODUCT_DETAIL_FIELDS = gql`
  fragment ProductDetailFields on Product {
    ...CoreProductFields
    description
    additionalDescription # Nếu có
    details # Mảng các chuỗi chi tiết
    styleCode
    composition
    careInstructions
    collections {
      ...CollectionFields
    }
    availableSizes {
      ...SizeFields
    }
    inventory { # Danh sách tồn kho theo màu, size
      id
      quantity
      colorId # Hoặc color { id }
      sizeId  # Hoặc size { id }
    }
    allImages: images { # Lấy tất cả hình ảnh của sản phẩm nếu có
      ...ImageFields
    }
    # relatedProducts(limit: 4) { ...CoreProductFields }
  }
  ${CORE_PRODUCT_FIELDS}
  ${COLLECTION_FIELDS}
  ${SIZE_FIELDS}
  ${IMAGE_FIELDS}
`;

export const USER_ADDRESS_FIELDS = gql`
    fragment UserAddressFields on Address { # Hoặc tên Type Address của bạn
        id
        fullName # Hoặc firstName, lastName
        addressLine1
        addressLine2
        city
        stateOrProvince
        postalCode
        country
        phoneNumber
        isDefaultShipping
        isDefaultBilling
    }
`;

export const USER_INFO_FIELDS = gql`
  fragment UserInfoFields on User { # Hoặc Customer
    id
    firstName
    lastName
    email
    phoneNumber
    # dateOfBirth
    # avatarUrl
    # defaultShippingAddress { ...UserAddressFields }
    # defaultBillingAddress { ...UserAddressFields }
    addresses { # Danh sách địa chỉ đã lưu
      ...UserAddressFields
    }
  }
  ${USER_ADDRESS_FIELDS}
`;

export const ORDER_ITEM_FIELDS = gql`
    fragment OrderItemFields on SalesItem { # Hoặc OrderItem
        id
        quantity
        pricePerUnit # Giá tại thời điểm mua
        totalPrice
        product { # Thông tin sản phẩm đã mua
            id
            name
            slug
            # mainImage { url(transform: {width: 80, height: 100}) }
        }
        selectedColor { name hex } # Thông tin màu đã chọn
        selectedSize { name } # Thông tin size đã chọn
    }
`;

export const CORE_ORDER_FIELDS = gql`
  fragment CoreOrderFields on Sale { # Hoặc Order
    id
    orderNumber # Hoặc một mã đơn hàng dễ đọc hơn
    createdAt
    updatedAt
    status # (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELED)
    paymentStatus
    subtotal
    shippingCost
    taxes
    discountAmount
    total
    # itemCount # Tổng số lượng sản phẩm
  }
`;

export const ORDER_DETAIL_FIELDS = gql`
    fragment OrderDetailFields on Sale { # Hoặc Order
        ...CoreOrderFields
        items {
            ...OrderItemFields
        }
        customer { # Nếu query từ admin hoặc cần thông tin customer
            id
            firstName
            lastName
            email
        }
        shippingAddress {
            ...UserAddressFields
        }
        billingAddress {
            ...UserAddressFields
        }
        # paymentMethod { type, last4 }
        # shippingMethod { name, estimatedDelivery }
        # notesFromCustomer
        # statusHistory { status, timestamp, notes }
    }
    ${CORE_ORDER_FIELDS}
    ${ORDER_ITEM_FIELDS}
    ${USER_ADDRESS_FIELDS}
`;