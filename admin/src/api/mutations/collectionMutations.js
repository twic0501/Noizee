import { gql } from '@apollo/client';

export const ADMIN_CREATE_COLLECTION_MUTATION = gql`
  mutation AdminCreateCollection($input: AdminCollectionInput!) { # <<< SỬA LẠI TÊN Ở ĐÂY (nếu AdminCollectionInput là tên đúng từ schema)
    adminCreateCollection(input: $input) {
      collection_id
      collection_name
      collection_description
      slug
    }
  }
`;


export const ADMIN_UPDATE_COLLECTION_MUTATION = gql`
  mutation AdminUpdateCollection($id: ID!, $input: AdminUpdateCollectionInput!) { # <<< SỬA LẠI TÊN Ở ĐÂY (nếu AdminUpdateCollectionInput là tên đúng)
    adminUpdateCollection(id: $id, input: $input) {
      collection_id
      collection_name
      collection_description
      slug
    }
  }
`;


export const ADMIN_DELETE_COLLECTION_MUTATION = gql`
  mutation AdminDeleteCollection($id: ID!) {
    adminDeleteCollection(id: $id)
  }
`;