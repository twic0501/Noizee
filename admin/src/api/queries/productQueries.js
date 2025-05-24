// admin-frontend/src/api/graphql/queries/productQueries.js
import { gql } from '@apollo/client';

// Fragment for Color (used within ProductImage and Inventory)
// This should match the Color type definition in your backend schema
export const COLOR_FIELDS_FOR_PRODUCT = gql`
  fragment ColorFieldsForProduct on Color {
    color_id
    color_name # Or name(lang: $lang) if you have a resolver for it
    color_name_en # If you added this to your Color model and typeDef
    color_hex
    name(lang: $lang) # Assuming Color.name resolver exists and uses lang
  }
`;

// Fragment for ProductImage, ensuring its 'color' field (if it represents the swatch color) is fetched
export const PRODUCT_IMAGE_FIELDS = gql`
  ${COLOR_FIELDS_FOR_PRODUCT}
  fragment ProductImageFields on ProductImage {
    image_id
    image_url
    alt_text_vi
    alt_text_en
    alt_text(lang: $lang) # If ProductImage.alt_text field itself takes lang
    display_order
    color { # This is the Color object associated with ProductImage (e.g., swatch color)
      ...ColorFieldsForProduct # $lang from parent operation is in scope
    }
  }
`;

// Fragment for Size (used within Inventory)
export const SIZE_FIELDS_FOR_PRODUCT = gql`
  fragment SizeFieldsForProduct on Size {
    size_id
    size_name
  }
`;

// Fragment for Inventory, ensuring its 'color' and 'size' fields are fetched
export const INVENTORY_FIELDS = gql`
  ${COLOR_FIELDS_FOR_PRODUCT}
  ${SIZE_FIELDS_FOR_PRODUCT}
  fragment InventoryFields on Inventory {
    inventory_id
    quantity
    sku
    size_id # Keep for direct reference if needed
    color_id # Keep for direct reference if needed
    size {
      ...SizeFieldsForProduct
    }
    color { # This is the Color object for the inventory item (variant color)
      ...ColorFieldsForProduct # $lang from parent operation is in scope
    }
  }
`;

// Main fragment for Product details in Admin
export const PRODUCT_ADMIN_CORE_FIELDS = gql`
  ${PRODUCT_IMAGE_FIELDS}
  ${INVENTORY_FIELDS}
  # COLOR_FIELDS_FOR_PRODUCT and SIZE_FIELDS_FOR_PRODUCT are already included via above fragments

  fragment ProductAdminCoreFields on Product {
    product_id
    product_name_vi
    product_name_en
    product_description_vi
    product_description_en
    name(lang: $lang) # Virtual field for product name
    description(lang: $lang) # Virtual field for product description
    product_price
    is_new_arrival
    is_active
    category {
      category_id
      category_name_vi # Direct field
      category_name_en # Direct field
      name(lang: $lang) # Virtual field for category name
    }
    collections {
      collection_id
      collection_name_vi # Direct field
      collection_name_en # Direct field
      name(lang: $lang) # Virtual field for collection name
      slug
    }
    images { # Product.images field (list of ProductImage)
      ...ProductImageFields # $lang is in scope here if operation defines it
    }
    inventory { # Product.inventory field (list of Inventory)
      ...InventoryFields # $lang is in scope here if operation defines it
    }
  }
`;

// Queries using PRODUCT_ADMIN_CORE_FIELDS must define $lang if the fragment uses it
export const GET_ADMIN_PRODUCTS_QUERY = gql`
  query AdminGetAllProducts($limit: Int, $offset: Int, $filter: ProductFilterInput, $lang: String) {
    adminGetAllProducts(limit: $limit, offset: $offset, filter: $filter, lang: $lang) {
      count
      products {
        ...ProductAdminCoreFields
      }
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS}
`;

export const GET_ADMIN_PRODUCT_DETAILS_QUERY = gql`
  query AdminGetProductDetails($id: ID!, $lang: String) {
    adminGetProductDetails(id: $id, lang: $lang) {
      ...ProductAdminCoreFields
    }
  }
  ${PRODUCT_ADMIN_CORE_FIELDS}
`;

// Query to fetch options for Product Form (Categories, Sizes, Colors, Collections)
export const GET_PRODUCT_OPTIONS_QUERY = gql`
  query GetProductOptions($lang: String) {
    adminGetAllCategories(lang: $lang) {
      category_id
      category_name_vi
      category_name_en
      name(lang: $lang)
    }
    adminGetAllSizes { # Sizes usually don't need lang
      size_id
      size_name
    }
    adminGetAllColors(lang: $lang) { # Pass lang if Color.name resolver uses it
      color_id
      color_name
      color_name_en # If added to Color model
      color_hex
      name(lang: $lang)
    }
    adminGetAllCollections(lang: $lang) {
      collection_id
      collection_name_vi
      collection_name_en
      name(lang: $lang)
      slug
    }
  }
`;
