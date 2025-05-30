import { gql } from '@apollo/client';
import { CORE_PRODUCT_FIELDS, PRODUCT_DETAIL_FIELDS } from '../fragments'; // Import fragments

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput, $sort: ProductSortInput, $limit: Int, $offset: Int, $after: String) {
    products(filter: $filter, sort: $sort, limit: $limit, offset: $offset, after: $after) {
      items {
        ...CoreProductFields
        # Thêm các trường đặc thù chỉ cho danh sách nếu cần, ngoài CoreProductFields
      }
      totalCount # Tổng số sản phẩm khớp filter (nếu backend hỗ trợ)
      pageInfo { # Hoặc cursor/hasMore nếu dùng cursor-based pagination
          hasNextPage
          endCursor
          # hasPreviousPage
          # startCursor
      }
      # Hoặc:
      # cursor
      # hasMore
    }
  }
  ${CORE_PRODUCT_FIELDS} # Nhúng fragment
`;

export const GET_PRODUCT_DETAIL = gql`
  query GetProductDetail($id: ID, $slug: String) {
    product(id: $id, slug: $slug) {
      ...ProductDetailFields
    }
  }
  ${PRODUCT_DETAIL_FIELDS} # Nhúng fragment
`;

// Query để lấy các filter options (categories, colors, sizes, price ranges)
export const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions {
    categories(filter: { isActive: true }) { # Lấy các category đang hoạt động
      items {
        id
        name
        slug
        # productCount # Số sản phẩm trong category này
      }
    }
    colors { # Lấy tất cả màu có sẵn
      id
      name
      hex
    }
    sizes { # Lấy tất cả size có sẵn
      id
      name
    }
    # priceRange { min, max } # Nếu backend cung cấp min/max price
  }
`;