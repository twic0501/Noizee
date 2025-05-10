import { gql } from '@apollo/client';


export const ADMIN_CREATE_COLOR_MUTATION = gql`
  mutation AdminCreateColor($input: AdminColorInput!) { # <<< SỬA Ở ĐÂY (nếu AdminColorInput là tên đúng)
    adminCreateColor(input: $input) {
      color_id
      color_name
      color_hex
    }
  }
`;


export const ADMIN_UPDATE_COLOR_MUTATION = gql`
  mutation AdminUpdateColor($id: ID!, $input: AdminUpdateColorInput!) { # <<< SỬA Ở ĐÂY (nếu AdminUpdateColorInput là tên đúng)
    adminUpdateColor(id: $id, input: $input) {
      color_id
      color_name
      color_hex
    }
  }
`;


export const ADMIN_DELETE_COLOR_MUTATION = gql`
  mutation AdminDeleteColor($id: ID!) {
    adminDeleteColor(id: $id)
  }
`;