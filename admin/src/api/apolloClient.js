// src/api/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
// import logger from '../utils/logger'; // Bỏ comment nếu muốn debug token ở đây

const ADMIN_TOKEN_KEY = 'admin_token'; // Phải khớp với key trong AuthContext

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  // logger.debug('[Apollo authLink Admin] Token for request:', token ? 'Exists' : 'Missing');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      // Cấu hình typePolicies nếu cần, ví dụ để merge các danh sách khi phân trang
    },
  }),
  connectToDevTools: import.meta.env.DEV,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Tốt cho dữ liệu có thể thay đổi
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',    // Admin thường muốn dữ liệu mới nhất
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  }
});

export default client;