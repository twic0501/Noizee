// src/services/apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { onError } from "@apollo/client/link/error";

// Lấy URL từ biến môi trường, nếu không có thì dùng localhost
// Bạn có thể tạo file .env ở thư mục gốc dự án noizee-user-frontend
// và định nghĩa VITE_GRAPHQL_HTTP_URL và VITE_GRAPHQL_WS_URL trong đó
// Ví dụ: VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
//        VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
const httpUri = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';
const wsUri = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql'; // Hoặc /subscriptions tùy backend

const httpLink = new HttpLink({
  uri: httpUri,
});

const wsLink = new GraphQLWsLink(createClient({
  url: wsUri,
  connectionParams: () => {
    // Bạn có thể thêm token xác thực ở đây nếu subscription cần
    // const token = localStorage.getItem('authToken');
    // return token ? { authToken: token } : {};
    return {};
  },
}));

// Middleware để thêm token vào header của HTTP requests (cho Queries/Mutations)
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('authToken'); // Lấy token từ localStorage

  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    }
  });

  return forward(operation);
});

// Link xử lý lỗi (ví dụ: log lỗi, hoặc xử lý lỗi logout khi token hết hạn)
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}, Code: ${extensions?.code}`
      );
      // Ví dụ: Nếu lỗi là UNAUTHENTICATED, bạn có thể xử lý logout
      if (extensions?.code === 'UNAUTHENTICATED') {
        // localStorage.removeItem('authToken');
        // Xử lý logout, ví dụ redirect về trang login
        // window.location.href = '/login';
        console.warn("GraphQL authentication error. User might need to log in again.");
      }
    });

  if (networkError) console.error(`[Network error]: ${networkError}`);
});


// Sử dụng split để định tuyến request đến link phù hợp
// Queries/Mutations sẽ qua HTTP, Subscriptions sẽ qua WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink, // Link cho subscriptions
  ApolloLink.from([errorLink, authLink, httpLink]) // Link cho queries/mutations (đi qua error, auth rồi http)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Ví dụ về cách merge khi phân trang cho products, sales, blogPosts
          // Điều này giúp Apollo Client tự động nối thêm dữ liệu mới vào danh sách hiện tại
          // khi bạn fetch thêm (ví dụ: "Load More" button)
          products: {
            keyArgs: ["filter", "lang"], // Các args quyết định một danh sách là duy nhất
            merge(existing = { products: [], count: 0 }, incoming, { args }) {
              const mergedProducts = existing.products ? existing.products.slice(0) : [];
              if (incoming && incoming.products) {
                // Nếu offset = 0 hoặc không có offset, thay thế hoàn toàn
                if (!args || args.offset === 0 || typeof args.offset === 'undefined') {
                   return {
                    ...incoming,
                    products: [...incoming.products],
                   }
                }
                // Nối products
                for (let i = 0; i < incoming.products.length; ++i) {
                  mergedProducts[args.offset + i] = incoming.products[i];
                }
              }
              return {
                ...existing,
                ...incoming,
                products: mergedProducts,
              };
            },
          },
          // Tương tự cho mySales, adminGetAllSales, blogPosts, adminGetAllBlogPosts, etc.
          mySales: {
            keyArgs: false, // Hoặc các args filter nếu có
             merge(existing = { sales: [], count: 0 }, incoming, { args }) {
               // Logic tương tự như products
                const mergedSales = existing.sales ? existing.sales.slice(0) : [];
                if (incoming && incoming.sales) {
                    if (!args || args.offset === 0 || typeof args.offset === 'undefined') {
                       return { ...incoming, sales: [...incoming.sales] };
                    }
                    for (let i = 0; i < incoming.sales.length; ++i) {
                        mergedSales[args.offset + i] = incoming.sales[i];
                    }
                }
                return { ...existing, ...incoming, sales: mergedSales };
            },
          },
           blogPosts: {
            keyArgs: ["filter", "lang"],
             merge(existing = { posts: [], count: 0 }, incoming, { args }) {
               // Logic tương tự như products
                const mergedPosts = existing.posts ? existing.posts.slice(0) : [];
                if (incoming && incoming.posts) {
                    if (!args || args.offset === 0 || typeof args.offset === 'undefined') {
                       return { ...incoming, posts: [...incoming.posts] };
                    }
                    for (let i = 0; i < incoming.posts.length; ++i) {
                        mergedPosts[args.offset + i] = incoming.posts[i];
                    }
                }
                return { ...existing, ...incoming, posts: mergedPosts };
            },
          },
        }
      }
    }
  })
});

export default client;