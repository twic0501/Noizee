// user/src/api/graphql/filterQueries.js (Hoặc productQueries.js)
import { gql } from '@apollo/client';

// Query để lấy tất cả các Category có sản phẩm
export const GET_FILTER_CATEGORIES_QUERY = gql`
  query GetFilterCategories {
    # Backend cần một query trả về danh sách category dùng cho filter
    # Ví dụ: filterableCategories hoặc categories(hasProducts: true)
    filterableCategories { # Hoặc tên query bạn định nghĩa ở backend
      id
      name
      slug
      # productCount # Số lượng sản phẩm trong category này (tùy chọn)
    }
  }
`;

// Query để lấy tất cả các Collection có sản phẩm
export const GET_FILTER_COLLECTIONS_QUERY = gql`
  query GetFilterCollections {
    filterableCollections { # Hoặc tên query bạn định nghĩa ở backend
      id
      name
      slug
      # productCount
    }
  }
`;

// Query để lấy tất cả các Màu có sẵn trong các sản phẩm
export const GET_FILTER_COLORS_QUERY = gql`
  query GetFilterColors {
    filterableColors { # Hoặc tên query bạn định nghĩa ở backend
      id
      name
      hexCode
      # productCount
    }
  }
`;

// Query để lấy tất cả các Size có sẵn trong các sản phẩm
export const GET_FILTER_SIZES_QUERY = gql`
  query GetFilterSizes {
    filterableSizes { # Hoặc tên query bạn định nghĩa ở backend
      id
      name
      # productCount
    }
  }
`;

// Backend cũng cần cung cấp min/max price của tất cả sản phẩm để làm price range slider
export const GET_PRICE_RANGE_QUERY = gql`
  query GetPriceRange {
    productPriceRange { # Query này cần được định nghĩa ở backend
      min
      max
    }
  }
`;