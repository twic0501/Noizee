// admin-frontend/src/api/graphql/mutations/colorMutations.js
import { gql } from '@apollo/client';

// Input type AdminColorInput giờ chỉ cần color_name
export const ADMIN_CREATE_COLOR_MUTATION = gql`
  mutation AdminCreateColor($input: AdminColorInput!) {
    adminCreateColor(input: $input) {
      color_id
      color_name # Trả về color_name
      color_hex
      name # Trả về trường ảo name
    }
  }
`;

export const ADMIN_UPDATE_COLOR_MUTATION = gql`
  mutation AdminUpdateColor($id: ID!, $input: AdminColorInput!) {
    adminUpdateColor(id: $id, input: $input) {
      color_id
      color_name
      color_hex
      name
    }
  }
`;

export const ADMIN_DELETE_COLOR_MUTATION = gql`
  mutation AdminDeleteColor($id: ID!) {
    adminDeleteColor(id: $id)
  }
`;
