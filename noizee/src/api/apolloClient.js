import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
// import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
// import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql', // Nên có fallback nếu .env chưa có
});

// const wsLink = new GraphQLWsLink(createClient({
//   url: import.meta.env.VITE_GRAPHQL_WS_ENDPOINT || 'ws://localhost:4000/graphql',
//   connectionParams: () => {
//     const token = localStorage.getItem('authToken');
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   },
// }));

// const link = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return (
//       definition.kind === 'OperationDefinition' &&
//       definition.operation === 'subscription'
//     );
//   },
//   wsLink,
//   httpLink,
// );

const client = new ApolloClient({
    link: httpLink, // Sử dụng `link` thay vì `httpLink` nếu có `splitLink`
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    // Ví dụ: Cấu hình merge cho query lấy danh sách sản phẩm có pagination (cursor-based hoặc offset-based)
                    // Giả sử query 'products' trả về cấu trúc: { items: [Product!], cursor: String, hasMore: Boolean }
                    products: {
                        keyArgs: ['filter', 'sort'], // Các args dùng để phân biệt các lần gọi query khác nhau
                        merge(existing = { items: [], cursor: null, hasMore: true }, incoming, { args }) {
                            // Logic merge cho "load more"
                            // Nếu là trang đầu tiên (không có args.after hoặc args.offset === 0), thì thay thế hoàn toàn
                            if (!args?.after && (args?.offset === undefined || args?.offset === 0)) {
                                return incoming;
                            }
                            // Nếu là "load more"
                            return {
                                ...incoming, // Giữ lại cursor mới và hasMore mới
                                items: existing.items ? [...existing.items, ...incoming.items] : incoming.items,
                            };
                        },
                    },
                    // Tương tự cho các query lấy danh sách khác như categories, collections, blogPosts, orders
                    // Ví dụ cho categories (nếu không có pagination phức tạp, chỉ cần keyArgs là đủ)
                    categories: {
                        keyArgs: ['filter'],
                    },
                    // ...
                },
            },
            // Định danh các object bằng ID để Apollo Client có thể cập nhật cache chính xác
            // khi một mutation trả về object đó hoặc khi bạn dùng writeQuery/writeFragment.
            Product: {
                keyFields: ["id"], // Hoặc ["slug"] nếu slug là duy nhất và dùng làm key
            },
            Category: {
                keyFields: ["id"],
            },
            Collection: {
                keyFields: ["id"],
            },
            User: { // Hoặc Customer
                keyFields: ["id"],
            },
            Sale: { // Hoặc Order
                keyFields: ["id"],
            },
            BlogPost: {
                keyFields: ["id"],
            }
            // Thêm các type khác nếu cần
        },
    }),
    connectToDevTools: import.meta.env.DEV,
    defaultOptions: { // Cấu hình default options cho các loại operation
        watchQuery: {
            fetchPolicy: 'cache-and-network', // Chiến lược fetch mặc định cho watchQuery
            errorPolicy: 'ignore',
        },
        query: {
            fetchPolicy: 'network-only', // Chiến lược fetch mặc định cho query (có thể đổi thành 'cache-first')
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

export default client;