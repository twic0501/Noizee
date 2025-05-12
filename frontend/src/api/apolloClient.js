// src/api/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { USER_TOKEN_KEY } from '../utils/constants'; // Key để lấy token

// Link HTTP đến GraphQL endpoint của bạn
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
});

// Middleware để gắn token vào header Authorization cho mỗi request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(USER_TOKEN_KEY); // Lấy token của user
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Khởi tạo Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink), // Kết hợp authLink (gắn token) và httpLink (gửi request)
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Chính sách merge cho query 'products' (danh sách sản phẩm)
          products: {
            keyArgs: ["filter"], // Cache sẽ được phân biệt dựa trên giá trị của 'filter'
                                 // Nếu filter thay đổi, Apollo sẽ coi đó là một query mới.
                                 // Nếu filter giữ nguyên và chỉ offset/limit thay đổi, nó sẽ cố merge.
            merge(existing = { products: [], count: 0 }, incoming, { args }) {
              const mergedProducts = existing.products ? [...existing.products] : [];

              if (args?.offset === 0 || !existing.products.length) {
                // Nếu là trang đầu tiên (offset=0) hoặc chưa có dữ liệu cũ,
                // thì thay thế hoàn toàn bằng dữ liệu mới.
                return {
                  ...incoming, // Bao gồm cả 'count' từ incoming
                  products: [...incoming.products],
                };
              }

              // Nếu là các trang sau, nối dữ liệu mới vào.
              // Cần đảm bảo không có item trùng lặp nếu backend có thể trả về trùng.
              // Logic này giả định backend trả về các item không trùng lặp qua các trang.
              if (incoming.products) {
                mergedProducts.push(...incoming.products);
              }

              return {
                ...incoming, // Quan trọng: lấy 'count' từ incoming để cập nhật tổng số item
                products: mergedProducts,
              };
            },
          },
          // Chính sách merge cho query 'mySales' (lịch sử đơn hàng của tôi)
          mySales: {
            keyArgs: false, // Giả sử mySales không có filter phức tạp, chỉ phân trang
            merge(existing = { sales: [], count: 0 }, incoming, { args }) {
              const mergedSales = existing.sales ? [...existing.sales] : [];
              if (args?.offset === 0 || !existing.sales.length) {
                return {
                  ...incoming,
                  sales: [...incoming.sales],
                };
              }
              if (incoming.sales) {
                mergedSales.push(...incoming.sales);
              }
              return {
                ...incoming,
                sales: mergedSales,
              };
            },
          },
          // Cân nhắc thêm type policy cho các query danh sách khác nếu có phân trang
          // ví dụ: adminGetAllSales, adminGetAllUsers trong admin frontend.
        },
      },
      // Nếu bạn cần cập nhật một item cụ thể trong cache sau mutation,
      // bạn có thể định nghĩa field policy cho Type đó. Ví dụ:
      // Sale: {
      //   fields: {
      //     // ...
      //   }
      // },
      // Product: {
      //   fields: {
      //     // ...
      //   }
      // }
    }
  }),
  connectToDevTools: import.meta.env.DEV, // Bật Apollo DevTools khi ở môi trường development
  defaultOptions: { // Các tùy chọn mặc định (tùy chọn)
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Chính sách fetch mặc định cho watchQuery
                                        // (Lấy từ cache trước, rồi fetch từ network và cập nhật cache)
    },
    query: {
      fetchPolicy: 'network-only',    // Chính sách fetch mặc định cho query (luôn lấy từ network)
                                      // Bạn có thể đổi thành 'cache-first' hoặc 'cache-and-network'
                                      // nếu muốn ưu tiên cache hơn.
      errorPolicy: 'all',             // Hiển thị cả lỗi GraphQL và lỗi mạng
    },
    mutate: {
      errorPolicy: 'all',             // Tương tự cho mutations
    },
  }
});

export default client;