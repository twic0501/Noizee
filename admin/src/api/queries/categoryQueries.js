import { gql } from '@apollo/client';


export const GET_ALL_CATEGORIES_QUERY = gql`
  query GetAllCategories {
    categories { # Hoặc adminGetAllCategories
      category_id
      category_name
    }
  }
`;