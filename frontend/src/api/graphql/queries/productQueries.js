// src/api/graphql/queries/productQueries.js
import { gql } from '@apollo/client';

// Fragment cho các trường Product cơ bản dùng chung
// Đã bỏ product_stock và thêm inventory
const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
    product_id
    product_name
    product_price
    imageUrl
    secondaryImageUrl # Nếu bạn dùng ảnh hover
    isNewArrival
    is_active # Cờ ẩn hiện sản phẩm
    category {
      category_id
      category_name
    }
    # Các trường sizes, colors ở đây là MẢNG CÁC SIZE/COLOR MÀ SẢN PHẨM CÓ THỂ CÓ
    # (không phải biến thể cụ thể trong kho)
    sizes {
      size_id
      size_name
    }
    colors {
      color_id
      color_name
      color_hex
    }
    collections { # Nếu cần hiển thị sản phẩm thuộc collection nào
        collection_id
        collection_name
        slug
    }
    # Inventory là MẢNG CÁC BIẾN THỂ TỒN KHO THỰC TẾ
    inventory {
      inventory_id
      size_id # ID của size cho biến thể này (nếu có)
      color_id # ID của color cho biến thể này (nếu có)
      quantity # Số lượng tồn kho của biến thể này
      sku # SKU riêng của biến thể (nếu có)
      size { # Thông tin chi tiết của size (nếu cần)
        size_id
        size_name
      }
      color { # Thông tin chi tiết của color (nếu cần)
        color_id
        color_name
        color_hex
      }
    }
  }
`;

// Query lấy danh sách sản phẩm (cho trang Collections, tìm kiếm...)
export const GET_PRODUCTS_QUERY = gql`
  ${PRODUCT_CORE_FIELDS}
  query GetProducts($filter: ProductFilterInput, $limit: Int, $offset: Int) {
    products(filter: $filter, limit: $limit, offset: $offset) {
      count # Tổng số sản phẩm khớp filter (để phân trang)
      products {
        ...ProductCoreFields
        # Thêm các trường khác chỉ cần cho list view nếu có
      }
    }
  }
`;

// Query lấy chi tiết một sản phẩm
export const GET_PRODUCT_DETAILS_QUERY = gql`
  ${PRODUCT_CORE_FIELDS}
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      ...ProductCoreFields
      product_description # Thêm mô tả cho trang chi tiết
      # collections đã có trong fragment
    }
  }
`;

// Query lấy các options cho bộ lọc (Categories, Sizes, Colors...)
export const GET_FILTER_OPTIONS_QUERY = gql`
  query GetFilterOptions {
    categories { # Lấy tất cả categories cho filter
      category_id
      category_name
    }
    sizes { # Lấy tất cả sizes cho filter
      size_id
      size_name
    }
    # Lấy tất cả màu cho filter (dùng query public)
    availableColors: publicGetAllColors { # Đổi tên query nếu khác
      color_id
      color_name
      color_hex
    }
    # Tương tự cho Collections nếu cần filter theo collection
    # availableCollections: collections {
    #   collection_id
    #   collection_name
    #   slug
    # }
  }
`;