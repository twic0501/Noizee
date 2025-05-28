// src/api/graphql/filterQueries.js (User Frontend)
import { gql } from '@apollo/client';

// Query để lấy tất cả các Category có sản phẩm (cho user filter)
// Đổi tên query từ filterableCategories thành categories cho khớp với typeDefs.js
export const GET_FILTER_CATEGORIES_QUERY = gql`
  query GetUserFilterCategories($lang: String) { # Đổi tên operation cho rõ ràng
    categories(lang: $lang) { # Sử dụng query 'categories' từ typeDefs.js
      category_id
      name(lang: $lang) # Trường ảo name đã có resolver
      # slug # Nếu CategoryType có slug và bạn cần nó cho filter link
    }
  }
`;

// Query để lấy tất cả các Collection có sản phẩm (cho user filter)
// Giữ nguyên nếu 'filterableCollections' là đúng, nếu không cũng cần đổi thành 'collections'
// Dựa trên typeDefs.js của bạn, query cho collections là 'collections'
export const GET_FILTER_COLLECTIONS_QUERY = gql`
  query GetUserFilterCollections($lang: String) { # Đổi tên operation
    collections(lang: $lang) { # Sử dụng query 'collections'
      collection_id
      name(lang: $lang)
      slug
      # productCount # Nếu có
    }
  }
`;

// Query để lấy tất cả các Màu có sẵn trong các sản phẩm (cho user filter)
// Đổi tên query từ filterableColors thành publicGetAllColors
export const GET_FILTER_COLORS_QUERY = gql`
  query GetUserFilterColors($lang: String) { # Đổi tên operation
    publicGetAllColors(lang: $lang) { # Sử dụng query 'publicGetAllColors'
      color_id
      name(lang: $lang) # Trường ảo name đã có resolver
      color_hex
      # productCount # Nếu có
    }
  }
`;

// Query để lấy tất cả các Size có sẵn trong các sản phẩm (cho user filter)
// Đổi tên query từ filterableSizes thành sizes
export const GET_FILTER_SIZES_QUERY = gql`
  query GetUserFilterSizes { # Query 'sizes' không nhận 'lang' theo typeDefs
    sizes { # Sử dụng query 'sizes'
      size_id
      size_name
      # productCount # Nếu có
    }
  }
`;

// Backend cũng cần cung cấp min/max price của tất cả sản phẩm để làm price range slider
// Giữ nguyên query này nếu 'productPriceRange' tồn tại trong schema của bạn.
// Nếu không, bạn cần tạo query tương ứng ở backend.
export const GET_PRICE_RANGE_QUERY = gql`
  query GetProductPriceRange { # Đổi tên operation
    productPriceRange { # Query này cần được định nghĩa ở backend
      min
      max
    }
  }
`;
