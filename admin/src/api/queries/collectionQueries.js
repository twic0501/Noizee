// admin-frontend/src/api/graphql/queries/collectionQueries.js
import { gql } from '@apollo/client';

export const ADMIN_GET_ALL_COLLECTIONS_QUERY = gql`
  query AdminGetAllCollections($lang: String) { # Thêm biến lang
    adminGetAllCollections(lang: $lang) { # Truyền lang
      collection_id
      collection_name_vi
      collection_name_en
      collection_description_vi
      collection_description_en
      slug
      name(lang: $lang)
      description(lang: $lang)
      # productCount 
    }
  }
`;

// export const ADMIN_GET_COLLECTION_DETAILS_QUERY = gql`
//   query AdminGetCollectionDetails($id: ID!, $lang: String) {
//     adminGetCollectionById(id: $id, lang: $lang) { // Giả sử có query này
//       collection_id
//       collection_name_vi
//       collection_name_en
//       // ... các trường khác ...
//       name(lang: $lang)
//     }
//   }
// `;
