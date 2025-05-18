// admin-frontend/src/api/graphql/queries/productQueries.js
import { gql } from '@apollo/client';

// Fragment for ProductImage, assuming ProductImage.color resolves to a Color type
export const PRODUCT_IMAGE_FIELDS = gql`
  fragment ProductImageFields on ProductImage {
    image_id
    image_url
    alt_text_vi
    alt_text_en
    # alt_text(lang: $lang) # Use if ProductImage.alt_text field itself takes lang
    display_order
    color { # This is the Color object associated with ProductImage (e.g., swatch color)
      color_id
      color_name
      color_hex
      name(lang: $lang) # Virtual field for Color, uses $lang from parent operation
    }
  }
`;

// Fragment for Inventory, expecting 'color' field to resolve to a Color type
export const INVENTORY_FIELDS = gql`
  fragment InventoryFields on Inventory {
    inventory_id
    quantity
    sku
    size_id 
    color_id 
    size {
      size_id
      size_name
    }
    # CORRECTED: Query for 'color' field on Inventory type
    color { 
      color_id
      color_name
      color_hex
      name(lang: $lang) # Virtual field for Color, uses $lang from parent operation
    }
  }
`;

export const PRODUCT_ADMIN_CORE_FIELDS = gql`
  fragment ProductAdminCoreFields on Product {
    product_id
    product_name_vi
    product_name_en
    product_description_vi
    product_description_en
    name(lang: $lang) 
    description(lang: $lang) 
    product_price
    is_new_arrival
    is_active
    category {
      category_id
      # category_name_vi # Direct fields can be requested
      # category_name_en
      name(lang: $lang) 
    }
    collections {
      collection_id
      # collection_name_vi
      # collection_name_en
      name(lang: $lang) 
      slug
    }
    images { # Product.images field does not take lang
      ...ProductImageFields # $lang is in scope here if operation defines it
    }
    inventory { # Product.inventory field does not take lang
      ...InventoryFields # $lang is in scope here if operation defines it
    }
  }
  ${PRODUCT_IMAGE_FIELDS}
  ${INVENTORY_FIELDS}
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

export const GET_PRODUCT_OPTIONS_QUERY = gql`
  query GetProductOptions($lang: String) {
    adminGetAllCategories(lang: $lang) {
      category_id
      category_name_vi
      category_name_en
      name(lang: $lang)
    }
    adminGetAllSizes {
      size_id
      size_name
    }
    adminGetAllColors(lang: $lang) { # Pass lang if Color.name resolver uses it
      color_id
      color_name
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
