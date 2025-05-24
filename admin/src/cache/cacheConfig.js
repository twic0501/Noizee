import { InMemoryCache } from '@apollo/client';
import { offsetLimitPagination } from '@apollo/client/utilities';

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Cấu hình pagination cho products
        adminGetAllProducts: offsetLimitPagination(['filter']),
        
        // Cache cho categories
        adminGetAllCategories: {
          merge(existing, incoming) {
            return incoming;
          },
          read(existing) {
            return existing;
          },
        },

        // Cache cho product details
        adminGetProductDetails: {
          read(existing, { args: { id } }) {
            return existing;
          },
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
      },
    },
    Product: {
      fields: {
        images: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        inventory: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});