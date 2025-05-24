// src/api/apolloClientUser.js
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import i18n from '../i18nUser'; // Import instance i18next của user frontend

// Key token của người dùng (nếu có chức năng đăng nhập cho user)
const USER_TOKEN_KEY = 'user_token'; 
// Key lưu ngôn ngữ trong localStorage, đồng bộ với i18nUser.js
export const USER_LANGUAGE_KEY = 'user_preferred_lang'; 

const httpLink = createHttpLink({
  // Đảm bảo URI này đúng với GraphQL endpoint của bạn
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT_USER || 'http://localhost:5000/graphql', 
});

// Link để thêm Authorization header nếu người dùng đã đăng nhập
const authLinkUser = setContext((_, { headers }) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Link để thêm header ngôn ngữ cho mỗi request
const languageLinkUser = setContext((_, { headers }) => {
  // Lấy ngôn ngữ hiện tại từ i18next instance, fallback về localStorage hoặc 'vi'
  const currentLang = i18n.language || localStorage.getItem(USER_LANGUAGE_KEY) || 'vi';
  return {
    headers: {
      ...headers,
      'x-client-lang': currentLang, // Header tùy chỉnh để backend biết ngôn ngữ client
      // Hoặc có thể dùng 'Accept-Language': currentLang, nếu backend của bạn ưu tiên header này
    }
  };
});

const clientUser = new ApolloClient({
  // Nối các link: authLink (nếu có) -> languageLink -> httpLink
  link: ApolloLink.from([authLinkUser, languageLinkUser, httpLink]), 
  cache: new InMemoryCache({
    typePolicies: {
      // Thêm typePolicies nếu cần cho User Frontend
      // Ví dụ: quản lý cache cho giỏ hàng, danh sách sản phẩm, v.v.
    },
  }),
  connectToDevTools: import.meta.env.DEV, // Bật dev tools trong môi trường development
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Chính sách fetch mặc định cho watchQuery
    },
    query: {
      fetchPolicy: 'network-only', // Chính sách fetch mặc định cho query
    },
    // mutate: { ... } // Tùy chọn cho mutation
  }
});

export default clientUser;
