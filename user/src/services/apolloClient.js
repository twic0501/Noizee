import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from "@apollo/client/link/retry";

// URI của GraphQL endpoint
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_GRAPHQL_URL || 'http://localhost:5000/graphql',
});

// Tên key cho token trong localStorage của user app
const TOKEN_KEY_NAME = 'userToken';

// Link để thêm Authorization header
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(TOKEN_KEY_NAME);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Link để xử lý lỗi tập trung
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`, extensions
      );
      // Xử lý lỗi xác thực (UNAUTHENTICATED)
      // Quan trọng: Cần có cơ chế để gọi hàm logout từ AuthContext một cách an toàn
      // Hoặc một cách khác để thông báo cho AuthContext biết cần logout
      if (extensions && (extensions.code === 'UNAUTHENTICATED' || extensions.code === 'FORBIDDEN')) {
        // Xử lý logout ở đây có thể không phải là nơi tốt nhất vì access trực tiếp vào AuthContext khó.
        // Một cách tiếp cận là dispatch một custom event mà AuthContext lắng nghe.
        // Hoặc, các component sử dụng useMutation/useQuery sẽ tự xử lý lỗi này và gọi logout.
        // Tạm thời chỉ log và cảnh báo.
        console.warn(`GraphQL authentication/authorization error (${extensions.code}). Consider logging out user.`);
        // localStorage.removeItem(TOKEN_KEY_NAME); // AuthContext sẽ làm điều này khi logout
        // window.dispatchEvent(new CustomEvent('auth-error-logout')); // Ví dụ custom event
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError} - Operation: ${operation.operationName}`);
    // TODO: Hiển thị thông báo lỗi mạng thân thiện cho người dùng
  }
});

// Link để tự động thử lại request
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 3, // Giảm số lần thử lại cho user-facing app để không chờ quá lâu
    retryIf: (error, _operation) => !!error // Thử lại với mọi lỗi mạng hoặc lỗi server (5xx)
  }
});

// Kết hợp các link lại
const link = from([
  retryLink,
  errorLink,
  authLink,
  httpLink,
]);

const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache({
    typePolicies: {
      // Các typePolicies này rất quan trọng để Apollo Client quản lý cache hiệu quả
      // Đặc biệt là keyFields để nhận diện các object.
      Query: {
        fields: {
          // Ví dụ cho query products nếu có phân trang/filter
          // products: {
          //   keyArgs: ["filter", "sortBy", "sortOrder"], // Các args dùng để phân biệt cache
          //   merge(existing = { items: [], totalCount: 0 }, incoming) {
          //     return {
          //       ...incoming, // incoming có thể có totalCount mới
          //       items: [...(existing.items || []), ...incoming.items],
          //     };
          //   },
          // },
        },
      },
      // Dựa theo typeDefs.js của bạn:
      CustomerType: { keyFields: ["customer_id"] },
      ProductType: { keyFields: ["product_id"] }, // Nếu ProductType có trường id
      CategoryType: { keyFields: ["category_id"] },// Nếu CategoryType có trường id
      CollectionType: { keyFields: ["collection_id"] },// Nếu CollectionType có trường id
      SaleType: { keyFields: ["sale_id"] }, // Nếu SaleType (Order) có trường id
      // Thêm các Type khác nếu cần
    },
  }),
  connectToDevTools: process.env.NODE_ENV !== 'production',
});

export default client;