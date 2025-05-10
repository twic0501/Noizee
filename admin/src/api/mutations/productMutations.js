import { gql } from '@apollo/client';

export const CREATE_PRODUCT_MUTATION = gql`
  mutation AdminCreateProduct($input: ProductCreateInput!) {
    adminCreateProduct(input: $input) {
      product_id
      product_name
      category { category_id category_name }
      sizes { size_id size_name }
      colors { color_id color_name }
      collections { collection_id collection_name }
      # Có thể thêm inventory nếu cần xem ngay sau khi tạo
      # inventory { inventory_id quantity size_id color_id }
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
    mutation AdminUpdateProduct($id: ID!, $input: ProductUpdateInput!) {
        adminUpdateProduct(id: $id, input: $input) {
            product_id
            product_name
            product_description
            product_price
            # product_stock # <<< XÓA DÒNG NÀY
            imageUrl
            secondaryImageUrl
            isNewArrival
            is_active
            category { category_id category_name }
            sizes { size_id size_name }
            colors { color_id color_name color_hex }
            collections { collection_id collection_name }
            inventory { # <<< Có thể thêm inventory nếu cần xem ngay sau khi sửa
                inventory_id
                size_id
                color_id
                quantity
            }
        }
    }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation AdminDeleteProduct($id: ID!) {
    adminDeleteProduct(id: $id) # Trả về boolean
  }
`;