// src/api/graphql/queries/productQueries.js
import { gql } from '@apollo/client';

// Fragment cho các trường Product cơ bản dùng chung
// Đã cập nhật để khớp với schema backend (sử dụng mảng 'images', 'is_new_arrival')
// Bỏ 'sizes' và 'colors' trực tiếp, sẽ lấy qua 'inventory' hoặc resolver riêng nếu cần
const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
    product_id
    name # Sử dụng resolver ảo name(lang: String)
    # product_name_vi # Hoặc lấy trực tiếp nếu không muốn dùng resolver ảo
    # product_name_en
    product_price
    is_new_arrival # Trường này được định nghĩa trong Product type ở backend
    is_active
    category {
      category_id
      name # Sử dụng resolver ảo name(lang: String)
      # category_name_vi
      # category_name_en
    }
    collections {
        collection_id
        name # Sử dụng resolver ảo name(lang: String)
        # collection_name_vi
        # collection_name_en
        slug
    }
    images { # Lấy mảng images thay vì imageUrl
      image_id
      image_url
      alt_text # Sử dụng resolver ảo alt_text(lang: String)
      # alt_text_vi
      # alt_text_en
      display_order
      color { # Nếu ảnh được liên kết với một màu cụ thể
        color_id
        name # Sử dụng resolver ảo name(lang: String)
        # color_name_vi
        # color_name_en
        color_hex
      }
    }
    inventory { # Lấy thông tin tồn kho, bao gồm size và color của từng biến thể
      inventory_id
      quantity
      sku
      size { # Thông tin size của biến thể này
        size_id
        size_name # Giả sử size_name không cần dịch hoặc đã được xử lý
      }
      color { # Thông tin color của biến thể này
        color_id
        name # Sử dụng resolver ảo name(lang: String) cho color
        # color_name_vi
        # color_name_en
        color_hex
      }
    }
    # Các trường 'sizes' và 'colors' trực tiếp trên Product có thể không tồn tại
    # Nếu bạn cần danh sách tất cả các size/color mà sản phẩm có (không phải biến thể cụ thể),
    # backend cần cung cấp một resolver riêng cho việc này, ví dụ:
    # availableSizes { size_id size_name }
    # availableColors { color_id color_name color_hex }
  }
`;

// Query lấy danh sách sản phẩm
export const GET_PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductFilterInput, $limit: Int, $offset: Int, $lang: String) {
    products(filter: $filter, limit: $limit, offset: $offset, lang: $lang) {
      count
      products {
        ...ProductCoreFields
        # Các trường resolver ảo sẽ tự động sử dụng 'lang' từ context nếu không truyền trực tiếp
        # Hoặc bạn có thể truyền 'lang' vào từng trường nếu cần:
        # name(lang: $lang)
        # category { name(lang: $lang) }
      }
    }
  }
  ${PRODUCT_CORE_FIELDS} # Đặt fragment ở cuối query
`;

// Query lấy chi tiết một sản phẩm
export const GET_PRODUCT_DETAILS_QUERY = gql`
  query GetProductDetails($id: ID!, $lang: String) {
    product(id: $id, lang: $lang) { # Truyền lang vào product query nếu resolver hỗ trợ
      ...ProductCoreFields
      description # Sử dụng resolver ảo description(lang: String)
      # description_vi
      # description_en
      # collections đã có trong fragment
      # Nếu cần danh sách tất cả các size/color có thể có của sản phẩm (không phải tồn kho cụ thể)
      # thì backend cần cung cấp resolver, ví dụ:
      # allAvailableSizes { size_id size_name }
      # allAvailableColors { color_id name(lang: $lang) color_hex }
    }
  }
  ${PRODUCT_CORE_FIELDS}
`;

// Query lấy các options cho bộ lọc
export const GET_FILTER_OPTIONS_QUERY = gql`
  query GetFilterOptions($lang: String) { # Thêm biến lang
    categories { # Lấy tất cả categories cho filter
      category_id
      name(lang: $lang) # Sử dụng resolver ảo
      # category_name_vi
      # category_name_en
      # slug # Nếu category có slug và bạn muốn dùng nó
    }
    sizes { # Lấy tất cả sizes cho filter (size_name thường không cần dịch)
      size_id
      size_name
    }
    publicGetAllColors(lang: $lang) { # Sử dụng query đã có, truyền lang
      color_id
      name # Resolver ảo name(lang: $lang) sẽ được dùng
      # color_name_vi
      # color_name_en
      color_hex
    }
    # collections(lang: $lang) { # Nếu cần filter theo collection
    #   collection_id
    #   name # Resolver ảo
    #   slug
    # }
  }
`;
