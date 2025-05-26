import { gql } from '@apollo/client';

// Fragment này giúp định nghĩa các trường của ProductType một lần và tái sử dụng
// Đảm bảo ProductType và các trường con (ImageSType, CategoryType, CollectionType, ProductVariantType)
// được định nghĩa trong backend/graphql/typeDefs.js với tên tương ứng và các trường camelCase.
export const PRODUCT_FIELDS_FRAGMENT = gql`
  fragment ProductCFields on ProductType {
    id
    name
    slug
    description
    price
    salePrice
    stockQuantity
    sku
    isFeatured
    isActive
    # averageRating # Nếu có
    # reviewCount # Nếu có
    createdAt
    updatedAt
    images { # Giả sử là mảng ImageType (hoặc tên bạn đặt, ví dụ ProductImageType)
      id
      imageUrl
      altText
      isPrimary
    }
    category { # Giả sử là CategoryType
      id
      name
      slug
    }
    collections { # Giả sử là mảng CollectionType
      id
      name
      slug
    }
    # variants { # Giả sử là mảng ProductVariantType
    #   id
    #   name # Ví dụ: "Red / Small"
    #   price # Giá riêng của variant
    #   stockQuantity # Tồn kho riêng của variant
    #   sku
    #   attributes { # Ví dụ: [{ name: "Color", value: "Red" }, { name: "Size", value: "Small" }]
    #     name
    #     value
    #   }
    #   image { imageUrl } # Ảnh riêng của variant nếu có
    # }
    # colors { id name hexCode } # Nếu bạn quản lý màu sắc riêng
    # sizes { id name } # Nếu bạn quản lý kích thước riêng
  }
`;

// Query để lấy danh sách sản phẩm
// Backend typeDefs: products(limit: Int, offset: Int, sortBy: String, sortOrder: String, filter: ProductFilterInput): ProductsPayload!
// ProductsPayload { items: [ProductType!]!, totalCount: Int!, pageInfo: PageInfo } (Ví dụ)
export const GET_PRODUCTS_QUERY = gql`
  query GetProducts(
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: String # ASC hoặc DESC
    $filter: ProductFilterInput
  ) {
    products(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      items {
        ...ProductFields
      }
      totalCount
      # pageInfo { # Nếu backend có trả về PageInfo theo Relay spec hoặc tương tự
      #   hasNextPage
      #   hasPreviousPage
      #   startCursor
      #   endCursor
      # }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Query để lấy chi tiết một sản phẩm bằng slug hoặc ID
// Backend typeDefs: product(id: ID, slug: String): ProductType
export const GET_PRODUCT_DETAILS_QUERY = gql`
  query GetProductDetails($id: ID, $slug: String) {
    product(id: $id, slug: $slug) {
      ...ProductFields
      # Thêm các trường chi tiết hơn nếu cần và nếu backend có, ví dụ:
      # relatedProducts { ...ProductFields }
      # reviews { id user { firstName } rating comment createdAt }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Query để lấy danh mục
// Backend typeDefs: categories: [CategoryType!]
export const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
      # imageUrl
      # parentCategory { id name }
      # productCount
    }
  }
`;

// Query để lấy collections
// Backend typeDefs: collections: [CollectionType!]
export const GET_COLLECTIONS_QUERY = gql`
  query GetCollections {
    collections {
      id
      name
      slug
      description
      # imageUrl
      # productCount
    }
  }
`;

// Input type ProductFilterInput (ví dụ, cần định nghĩa ở backend typeDefs.js)
// input ProductFilterInput {
//   categoryId: ID
//   collectionId: ID
//   minPrice: Float
//   maxPrice: Float
//   searchTerm: String
//   isFeatured: Boolean
//   isActive: Boolean
//   # Thêm các filter khác: colorId, sizeId, tags, etc.
// }