// src/api/graphql/productQueries.js (User Frontend)
import { gql } from '@apollo/client';

// Fragment for Color, specifically for product listings and details on user frontend
export const USER_COLOR_FIELDS_FRAGMENT = gql`
  fragment UserColorFields on Color {
    color_id
    name(lang: $lang) # Localized name
    color_hex
  }
`;

// Fragment for Size, for user frontend
export const USER_SIZE_FIELDS_FRAGMENT = gql`
  fragment UserSizeFields on Size {
    size_id
    size_name # Assuming size_name is not multilingual, or add name(lang: $lang) if it is
  }
`;

// Fragment for ProductImage, including its specific color (if any)
export const USER_PRODUCT_IMAGE_FIELDS_FRAGMENT = gql`
  ${USER_COLOR_FIELDS_FRAGMENT}
  fragment UserProductImageFields on ProductImage {
    image_id
    image_url
    alt_text(lang: $lang) # Localized alt text
    display_order
    color { # The specific color this image might represent (e.g., a red shirt image)
      ...UserColorFields
    }
  }
`;

// Fragment for Inventory details needed on user frontend
export const USER_INVENTORY_FIELDS_FRAGMENT = gql`
  ${USER_COLOR_FIELDS_FRAGMENT}
  ${USER_SIZE_FIELDS_FRAGMENT}
  fragment UserInventoryFields on Inventory {
    inventory_id
    quantity
    sku
    color { # The actual color of this inventory variant
      ...UserColorFields
    }
    size { # The actual size of this inventory variant
      ...UserSizeFields
    }
  }
`;

// Main Product Fragment for User Frontend
// This fragment will be used in ProductCard and ProductDetailPage
export const PRODUCT_FIELDS_FRAGMENT = gql`
  ${USER_PRODUCT_IMAGE_FIELDS_FRAGMENT}
  ${USER_INVENTORY_FIELDS_FRAGMENT}
  # USER_COLOR_FIELDS_FRAGMENT and USER_SIZE_FIELDS_FRAGMENT are included via the above

  fragment ProductFields on Product {
    product_id
    name(lang: $lang) # Localized product name
    description(lang: $lang) # Localized product description
    product_price
    is_new_arrival
    is_active # To ensure we only show active products, though backend query should handle this primarily
    category {
      category_id
      name(lang: $lang) # Localized category name
    }
    collections { # If you need to display collection info on the card/detail page
      collection_id
      name(lang: $lang) # Localized collection name
      slug
    }
    images { # List of all images for the product
      ...UserProductImageFields
    }
    inventory { # List of all inventory variants (color/size combinations)
      ...UserInventoryFields
    }
  }
`;

// Query to get a list of products for user frontend (ProductListingPage)
export const GET_PRODUCTS_QUERY = gql`
  query GetProducts(
    $limit: Int
    $offset: Int
    $filter: ProductFilterInput
    $lang: String # Language for localized fields
  ) {
    products( # Resolver 'products' from backend typeDefs
      limit: $limit
      offset: $offset
      filter: $filter
      lang: $lang # Pass lang to the main resolver if it influences root-level fetching/sorting
    ) {
      products { # Assuming backend returns { products: [], count: X }
        ...ProductFields # Fragment uses $lang defined in the operation
      }
      count # Total count for pagination
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Query to get details of a single product for user frontend (ProductDetailPage)
export const GET_PRODUCT_DETAILS_QUERY = gql`
  query GetProductDetails($id: ID!, $lang: String) { # Assuming backend uses id for product query
    product(id: $id, lang: $lang) { # Resolver 'product' from backend typeDefs
      ...ProductFields # Fragment uses $lang defined in the operation
      # Potentially add more detailed fields specific to the product detail page here
      # if they are not already in ProductFields and not needed for ProductCard.
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Query to get categories for user frontend (e.g., for navigation or filters)
export const GET_CATEGORIES_QUERY = gql`
  query GetCategories($lang: String) {
    categories(lang: $lang) { # Resolver 'categories' from backend typeDefs
      category_id
      name(lang: $lang) # Localized category name
    }
  }
`;

// Query to get collections for user frontend
export const GET_COLLECTIONS_QUERY = gql`
  query GetCollections($lang: String) {
    collections(lang: $lang) { # Resolver 'collections' from backend typeDefs
      collection_id
      name(lang: $lang) # Localized collection name
      slug
      description(lang: $lang) # Localized collection description
    }
  }
`;

// Query for featured products (example)
export const GET_FEATURED_PRODUCTS_QUERY = gql`
  query GetFeaturedProducts($limit: Int, $lang: String) {
    products(filter: { is_new_arrival: false }, limit: $limit, lang: $lang) { # Placeholder filter
      products {
        ...ProductFields # Using the comprehensive fragment
      }
      count
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Query for new arrival products (example)
export const GET_NEW_ARRIVALS_QUERY = gql`
  query GetNewArrivals($limit: Int, $lang: String) {
    products(filter: { is_new_arrival: true }, limit: $limit, lang: $lang) {
      products {
        ...ProductFields # Using the comprehensive fragment
      }
      count
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;