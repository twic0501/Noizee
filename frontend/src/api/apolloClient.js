import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { USER_TOKEN_KEY } from '../utils/constants';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          keyArgs: ['filter'],
          merge(existing, incoming, { args }) {
             console.log(`Apollo Cache Merge for products: Offset=${args?.offset}, Filter:`, args?.filter);
             // Luôn thay thế bằng dữ liệu mới khi load trang đầu tiên (offset 0) hoặc khi filter thay đổi
             if (!args?.offset || args.offset === 0) {
                 console.log('-> Cache policy: Replacing products (Offset 0 / Filter Change)');
                 return incoming; // Trả về dữ liệu mới nhất từ server
             }

             // Đối với các trang sau (offset > 0), logic merge mặc định của Apollo thường đủ tốt
             // nếu keyArgs được đặt đúng. Hoặc nếu muốn chắc chắn thay thế:
             // console.log('-> Cache policy: Replacing products (Offset > 0)');
             // return incoming;

             // Hoặc để Apollo tự xử lý merge cho các trang sau:
             // console.log('-> Cache policy: Letting Apollo handle merge (Offset > 0)');
             if (existing && incoming) {
                // Ví dụ merge đơn giản nếu cần (nhưng dễ sai)
                // return { ...incoming, products: [...existing.products, ...incoming.products] };
             }
             // Trả về incoming nếu không có existing hoặc không muốn merge phức tạp
              return incoming;
          },
        },
      },
    },
     Product: {
       keyFields: ["product_id"], // Giúp Apollo chuẩn hóa cache Product theo ID
     },
  },
});


const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: cache, // Sử dụng cache đã cấu hình
  connectToDevTools: import.meta.env.DEV,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only', // Bạn có thể đổi lại thành 'cache-and-network' sau khi test typePolicies
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  }
});

export default client;