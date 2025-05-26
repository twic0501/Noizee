export const APP_NAME = 'Noizee';

// API Endpoint
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_GRAPHQL_URL || 'http://localhost:5000/graphql';

// Storage Keys
export const AUTH_TOKEN_KEY = 'userToken'; // Nhất quán với AuthContext và ApolloClient của user/
export const USER_DATA_KEY = 'userData';   // Key cho object user data
export const CART_STORAGE_KEY = 'userCart';// Nhất quán với CartContext

// Language Settings
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

// UI Constants
export const PRODUCT_IMAGE_PLACEHOLDER = '/images/product-placeholder.webp'; // Cập nhật đường dẫn nếu cần
export const AVATAR_PLACEHOLDER = '/images/avatar-placeholder.png';
export const ITEMS_PER_PAGE_DEFAULT = 12; // Ví dụ cho phân trang sản phẩm

// Roles (tham khảo, backend là nguồn chính)
// export const USER_ROLES = {
//   CUSTOMER: 'customer',
//   ADMIN: 'admin',
//   SUPERADMIN: 'superadmin',
// };

// Regex (ví dụ)
// export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// export const PHONE_REGEX = /^\+?[0-9\s-()]{7,20}$/;

// Các hằng số khác
// ...