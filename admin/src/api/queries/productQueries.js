import { gql } from '@apollo/client';

const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
    product_id
    product_name
    product_price
    # product_stock # <<< XÓA DÒNG NÀY
    imageUrl
    secondaryImageUrl # Giữ lại nếu bạn dùng
    isNewArrival
    is_active # Giữ lại nếu bạn dùng
    category { category_id category_name }
    sizes { size_id size_name }
    colors { color_id color_name color_hex }
    collections { collection_id collection_name slug }
    inventory {           # <<< THÊM TRƯỜNG NÀY
        inventory_id
        size_id
        color_id
        quantity
        sku
        # Có thể lấy thêm tên size màu nếu cần hiển thị trực tiếp
        # size { size_name }
        # color { color_name color_hex }
    }
  }
`;

export const GET_ADMIN_PRODUCTS_QUERY = gql`
  ${PRODUCT_CORE_FIELDS}
  query AdminGetAllProducts($limit: Int, $offset: Int, $filter: ProductFilterInput) {
    adminGetAllProducts(limit: $limit, offset: $offset, filter: $filter) {
      count
      products {
        ...ProductCoreFields
      }
    }
  }
`;

export const GET_ADMIN_PRODUCT_DETAILS_QUERY = gql`
  ${PRODUCT_CORE_FIELDS}
  query AdminGetProductDetails($id: ID!) {
      adminGetProductDetails(id: $id) {
          ...ProductCoreFields
          product_description
      }
  }
`;

export const GET_PRODUCT_OPTIONS_QUERY = gql`
  query GetProductOptions {
      categories { category_id category_name }
      sizes { size_id size_name }
      adminGetAllColors { color_id color_name color_hex }
      adminGetAllCollections { collection_id collection_name }
  }
`;