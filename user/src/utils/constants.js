// src/utils/constants.js

export const APP_NAME = 'Noizee';

// API Endpoint
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_GRAPHQL_URL || 'http://localhost:5000/graphql';
// Base URL for serving static assets like images from the backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


// Storage Keys
export const AUTH_TOKEN_KEY = 'userToken';
export const USER_DATA_KEY = 'userData';
export const CART_STORAGE_KEY = 'userCart';

// Language Settings
export const DEFAULT_LANGUAGE = 'vi'; // Changed default to 'vi' as per your locale files
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

// UI Constants
export const PRODUCT_IMAGE_PLACEHOLDER = '/images/product-placeholder.webp';
export const AVATAR_PLACEHOLDER = '/images/avatar-placeholder.png';
export const ITEMS_PER_PAGE_DEFAULT = 12;

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
