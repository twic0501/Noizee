// admin-frontend/src/api/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
// import logger from '../utils/logger';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_LANGUAGE_KEY = 'admin_preferred_lang'; // Key để lưu ngôn ngữ admin chọn

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Link để thêm header ngôn ngữ
const languageLink = setContext((_, { headers }) => {
  const preferredLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi'; // Lấy từ localStorage hoặc mặc định 'vi'
  // logger.debug(`[Apollo languageLink] Sending lang: ${preferredLang}`);
  return {
    headers: {
      ...headers,
      'x-client-lang': preferredLang, // Gửi header tùy chỉnh
      // Hoặc 'Accept-Language': preferredLang, // Nếu backend ưu tiên header này
    }
  };
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, languageLink, httpLink]), // Nối các link lại, languageLink trước httpLink
  cache: new InMemoryCache({
    typePolicies: {
      // Product: {
      //   fields: {
      //     name: {
      //       read(existing, { args, readField }) {
      //         const lang = args?.lang || localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
      //         const fieldVi = readField(lang === 'en' ? 'product_name_en' : 'product_name_vi');
      //         const fieldEn = readField('product_name_en');
      //         return lang === 'en' && fieldEn ? fieldEn : fieldVi;
      //       }
      //     },
      //     // Tương tự cho description, và các trường đa ngôn ngữ của Category, Collection, BlogPost, BlogTag
      //   }
      // },
      // Category: { fields: { name: { read(...) } } },
      // Collection: { fields: { name: { read(...) }, description: { read(...) } } },
      // BlogPost: { fields: { title: { read(...) }, excerpt: { read(...) }, content_html: { read(...) } } },
      // BlogTag: { fields: { name: { read(...) } } },
      // ProductImage: { fields: { alt_text: { read(...) } } }
      // Cân nhắc kỹ việc dùng typePolicies cho đa ngôn ngữ ở client.
      // Nó có thể phức tạp và dễ gây lỗi nếu không cẩn thận.
      // Thường thì việc backend trả về đúng field (qua trường ảo hoặc client yêu cầu _vi/_en) sẽ đơn giản hơn.
    },
  }),
  connectToDevTools: import.meta.env.DEV,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  }
});

export default client;
