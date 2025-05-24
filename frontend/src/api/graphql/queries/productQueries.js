// src/api/graphql/queries/productQueries.js
import { gql } from '@apollo/client';

// Fragment cho các trường Product cơ bản dùng chung
// Đồng bộ hóa:
// - Các trường trực tiếp: product_id, product_price, is_new_arrival, is_active khớp với Product type.
// - Resolver ảo 'name': Được sử dụng, backend Product resolver có định nghĩa 'name(parent, args, context)' để xử lý lang.
// - Category: Lấy category_id và name (qua resolver ảo). Khớp với Category type và resolver.
// - Collections: Lấy collection_id, name (qua resolver ảo), slug. Khớp với Collection type và resolver.
// - Images: Lấy image_id, image_url, alt_text (qua resolver ảo), display_order, và color (nếu ảnh gắn với màu).
//   Khớp với ProductImage type và resolver (bao gồm cả resolver cho ProductImage.color).
// - Inventory: Lấy inventory_id, quantity, sku, size { size_id, size_name }, color { color_id, name, color_hex }.
//   Khớp với Inventory type và các resolver lồng nhau cho size và color (Inventory.size, Inventory.color).
const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
    product_id
    name # Sẽ sử dụng biến $lang được truyền vào query cha
    product_price
    is_new_arrival
    is_active
    category {
      category_id
      name # Sẽ sử dụng biến $lang được truyền vào query cha
    }
    collections {
      collection_id
      name # Sẽ sử dụng biến $lang được truyền vào query cha
      slug
    }
    images {
      image_id
      image_url
      alt_text # Sẽ sử dụng biến $lang được truyền vào query cha
      display_order
      color {
        color_id
        name # Sẽ sử dụng biến $lang được truyền vào query cha
        color_hex
      }
    }
    inventory {
      inventory_id
      quantity
      sku
      size {
        size_id
        size_name
      }
      color { # Đây là color của inventory item
        color_id
        name # Sẽ sử dụng biến $lang được truyền vào query cha
        color_hex
      }
    }
  }
`;

// Query lấy danh sách sản phẩm
// Đồng bộ hóa:
// - Tên query: 'products' và các tham số 'filter', 'limit', 'offset', 'lang' khớp với backend.
// - Cấu trúc trả về 'ProductListPayload' (count, products) khớp.
// - Sử dụng PRODUCT_CORE_FIELDS. Biến $lang được truyền vào query sẽ được các resolver ảo trong fragment sử dụng.
export const GET_PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductFilterInput, $limit: Int, $offset: Int, $lang: String) {
    products(filter: $filter, limit: $limit, offset: $offset, lang: $lang) {
      count
      products {
        ...ProductCoreFields
        # Nếu muốn truyền lang cụ thể cho từng trường, bạn có thể làm như sau,
        # nhưng thường thì truyền vào query cha là đủ nếu resolver được thiết kế tốt.
        # name(lang: $lang)
      }
    }
  }
  ${PRODUCT_CORE_FIELDS}
`;

// Query lấy chi tiết một sản phẩm
// Đồng bộ hóa:
// - Tên query: 'product' và các tham số 'id', 'lang' khớp với backend.
// - Sử dụng PRODUCT_CORE_FIELDS.
// - Lấy thêm 'description' (qua resolver ảo). Backend Product resolver có định nghĩa 'description(parent, args, context)'.
export const GET_PRODUCT_DETAILS_QUERY = gql`
  query GetProductDetails($id: ID!, $lang: String) {
    product(id: $id, lang: $lang) {
      ...ProductCoreFields
      description # Sẽ sử dụng biến $lang được truyền vào query
      # Các trường khác nếu cần, ví dụ:
      # meta_title(lang: $lang)
      # meta_description(lang: $lang)
    }
  }
  ${PRODUCT_CORE_FIELDS}
`;

// Query lấy các options cho bộ lọc
// Đồng bộ hóa:
// - Query 'categories(lang: $lang)': Lấy category_id, name. Khớp với backend.
// - Query 'sizes': Lấy size_id, size_name. Khớp với backend (sizes thường không cần lang).
// - Query 'publicGetAllColors(lang: $lang)': Lấy color_id, name, color_hex. Khớp với backend.
// - Query 'collections(lang: $lang)': (Đã bỏ comment) Lấy collection_id, name, slug. Khớp với backend.
//   Hữu ích nếu bạn muốn cho phép lọc theo collection.
export const GET_FILTER_OPTIONS_QUERY = gql`
  query GetFilterOptions($lang: String) {
    categories(lang: $lang) {
      category_id
      name # Sẽ sử dụng biến $lang
    }
    sizes {
      size_id
      size_name
    }
    publicGetAllColors(lang: $lang) {
      color_id
      name # Sẽ sử dụng biến $lang
      color_hex
    }
    collections(lang: $lang) { # Bỏ comment nếu bạn muốn dùng filter theo collection
      collection_id
      name # Sẽ sử dụng biến $lang
      slug
    }
  }
`;
