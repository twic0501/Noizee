// admin-frontend/src/api/graphql/mutations/collectionMutations.js
import { gql } from '@apollo/client';

export const ADMIN_CREATE_COLLECTION_MUTATION = gql`
  mutation AdminCreateCollection($input: AdminCollectionInput!) {
    adminCreateCollection(input: $input) {
      collection_id
      collection_name_vi
      collection_name_en
      collection_description_vi
      collection_description_en
      slug
      name(lang: "vi") # Trường ảo
      description(lang: "vi") # Trường ảo
    }
  }
`;

export const ADMIN_UPDATE_COLLECTION_MUTATION = gql`
  mutation AdminUpdateCollection($id: ID!, $input: AdminCollectionInput!) {
    adminUpdateCollection(id: $id, input: $input) {
      collection_id
      collection_name_vi
      collection_name_en
      collection_description_vi
      collection_description_en
      slug
      name(lang: "vi")
      description(lang: "vi")
    }
  }
`;

export const ADMIN_DELETE_COLLECTION_MUTATION = gql`
  mutation AdminDeleteCollection($id: ID!) {
    adminDeleteCollection(id: $id)
  }
`;
