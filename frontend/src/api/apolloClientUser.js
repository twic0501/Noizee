// src/api/apolloClientUser.js
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import i18n from '../i18nUser'; // Import instance i18next của user frontend

// Key để lưu token của người dùng trong localStorage
const USER_TOKEN_KEY = 'user_token'; // Đảm bảo key này nhất quán trong toàn bộ ứng dụng frontend

// Key để lưu ngôn ngữ ưu tiên của người dùng trong localStorage, đồng bộ với i18nUser.js
export const USER_LANGUAGE_KEY = 'user_preferred_lang'; // Đảm bảo key này nhất quán

// HTTP link đến GraphQL endpoint của bạn
// Đồng bộ hóa:
// - URI: Đảm bảo 'VITE_GRAPHQL_ENDPOINT_USER' trong file .env của bạn trỏ đúng đến URL của GraphQL server.
//   Giá trị fallback 'http://localhost:5000/graphql' là một ví dụ.
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT_USER || 'http://localhost:5000/graphql',
});

// Apollo Link để thêm Authorization header (Bearer token) vào mỗi request nếu người dùng đã đăng nhập.
// Đồng bộ hóa:
// - Lấy token từ localStorage bằng USER_TOKEN_KEY.
// - Gắn token vào header 'authorization' với tiền tố 'Bearer '.
// - Backend của bạn (trong middleware xác thực) sẽ đọc header này để xác thực người dùng.
const authLinkUser = setContext((_, { headers }) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Apollo Link để thêm header ngôn ngữ ('x-client-lang') vào mỗi request.
// Đồng bộ hóa:
// - Lấy ngôn ngữ hiện tại từ i18next (i18n.language), hoặc từ localStorage (USER_LANGUAGE_KEY), fallback về 'vi'.
// - Gắn ngôn ngữ vào header 'x-client-lang'.
// - Backend của bạn (trong middleware hoặc trực tiếp trong context setup của Apollo Server)
//   cần đọc header này và đưa giá trị vào 'context.lang' để các resolver có thể sử dụng.
const languageLinkUser = setContext((_, { headers }) => {
  const currentLang = i18n.language || localStorage.getItem(USER_LANGUAGE_KEY) || 'vi';
  return {
    headers: {
      ...headers,
      'x-client-lang': currentLang,
      // Cân nhắc: Một số server có thể ưu tiên 'Accept-Language': currentLang,
      // nhưng 'x-client-lang' là một header tùy chỉnh rõ ràng.
    }
  };
});

// Khởi tạo Apollo Client
// Đồng bộ hóa:
// - Link chain: authLinkUser -> languageLinkUser -> httpLink. Thứ tự này quan trọng.
//   languageLinkUser nên đứng sau authLinkUser để không ghi đè header authorization,
//   và cả hai đều đứng trước httpLink.
// - InMemoryCache: Cấu hình cache cơ bản.
//   - typePolicies: Bạn có thể thêm các chính sách cụ thể ở đây nếu cần, ví dụ, để merge các danh sách khi phân trang.
// - connectToDevTools: Bật Apollo DevTools trong môi trường development.
// - defaultOptions:
//   - watchQuery.fetchPolicy: 'cache-and-network' là một lựa chọn tốt, nó sẽ hiển thị dữ liệu từ cache trước rồi cập nhật từ network.
//   - query.fetchPolicy: 'network-only' đảm bảo dữ liệu luôn mới nhất cho các query độc lập, nhưng có thể làm chậm hơn.
//     Bạn có thể cân nhắc 'cache-first' hoặc 'cache-and-network' tùy theo yêu cầu cụ thể của từng query.
const clientUser = new ApolloClient({
  link: ApolloLink.from([authLinkUser, languageLinkUser, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Ví dụ: Nếu bạn có một query trả về danh sách sản phẩm và muốn merge khi fetch thêm (phân trang)
      // Query: {
      //   fields: {
      //     products: { // Tên query field của bạn
      //       keyArgs: ["filter"], // Các args ảnh hưởng đến việc cache riêng biệt (ví dụ: filter)
      //       merge(existing = { products: [] }, incoming, { args }) {
      //         const mergedProducts = existing.products ? existing.products.slice(0) : [];
      //         // Logic để merge, ví dụ dựa trên offset
      //         if (args && args.offset) {
      //           for (let i = 0; i < incoming.products.length; ++i) {
      //             mergedProducts[args.offset + i] = incoming.products[i];
      //           }
      //         } else {
      //           // Nếu không có offset hoặc logic khác, thay thế hoàn toàn
      //           return { ...existing, ...incoming };
      //         }
      //         return { ...existing, ...incoming, products: mergedProducts };
      //       },
      //     }
      //   }
      // }
    },
  }),
  connectToDevTools: import.meta.env.DEV,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only', // Cân nhắc thay đổi nếu cần hiệu năng cache tốt hơn
    },
    // mutate: {
    //   fetchPolicy: 'no-cache' // Thường thì mutation không cần cache kết quả
    // }
  }
});

export default clientUser;