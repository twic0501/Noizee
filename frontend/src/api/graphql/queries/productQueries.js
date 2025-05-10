import { gql } from '@apollo/client';

// Fragment cho các trường Product cơ bản dùng chung
const PRODUCT_FIELDS_FRAGMENT = gql`
  fragment ProductFields on Product {
    product_id
    product_name
    product_price
    imageUrl
    isNewArrival
    product_stock # Cần để kiểm tra sold out
    category {
      category_id
      category_name
    }
    sizes {
      size_id
      size_name
      # Thêm trường số lượng tồn kho theo size nếu backend hỗ trợ
    }
    colors {
      color_id
      color_name
      color_hex
      # Thêm trường số lượng tồn kho theo color nếu backend hỗ trợ
    }
  }
`;

// Query lấy danh sách sản phẩm (cho trang Collections)
export const GET_PRODUCTS_QUERY = gql`
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetProducts($filter: ProductFilterInput, $limit: Int, $offset: Int) {
    products(filter: $filter, limit: $limit, offset: $offset) {
      count
      products {
        ...ProductFields
        # Thêm các trường khác chỉ cần cho list view nếu có
      }
    }
  }
`;

// Query lấy chi tiết một sản phẩm
export const GET_PRODUCT_DETAILS_QUERY = gql`
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      ...ProductFields
      product_description # Thêm mô tả cho trang chi tiết
      collections {       # Thêm collection nếu cần hiển thị
        collection_id
        collection_name
        slug
      }
      # Thêm các trường chi tiết khác nếu cần (e.g., related products)
    }
  }
`;

// Query lấy các options cho bộ lọc (Categories, Sizes, Colors...)
// Giả sử query backend trả về đủ thông tin
export const GET_FILTER_OPTIONS_QUERY = gql`
  query GetFilterOptions {
    categories { category_id category_name }
    sizes { size_id size_name }
    # Giả định backend có query lấy tất cả màu dùng cho filter
    # Hoặc bạn có thể dùng query adminGetAllColors nếu user thường cũng truy cập được
    availableColors: adminGetAllColors { # Đổi tên alias nếu cần
       color_id color_name color_hex
    }
    # Tương tự cho Collections
    # availableCollections: collections { collection_id collection_name slug }
  }
`;