// src/utils/constants.js

// LocalStorage Keys
export const USER_TOKEN_KEY = 'noizee_user_token';
export const USER_INFO_KEY = 'noizee_user_info'; // Lưu trữ thông tin user (name, email, balance, etc.)
export const CART_STORAGE_KEY = 'noizee_cart';

// Default Page Limit for pagination
export const DEFAULT_PAGE_LIMIT = 12; // Ví dụ: 12 sản phẩm mỗi trang
export const ACCOUNT_ORDERS_LIMIT = 10; // Ví dụ: 10 đơn hàng mỗi trang trong tài khoản

// Default images
export const PLACEHOLDER_PRODUCT_IMAGE = '/images/placeholder.png'; // Đường dẫn tới ảnh placeholder

// Order Statuses (Nên đồng bộ với backend)
export const ORDER_STATUS = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed', // Có thể Delivered và Completed là một
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
};

// Collection Slugs (Nếu bạn dùng slug cố định để điều hướng hoặc fetch)
// export const COLLECTION_SLUGS = {
//   NEW_ARRIVALS: 'new-arrivals',
//   ACCESSORIES: 'accessories',
//   THE_NOIZEE: 'the-noizee',
//   // Thêm các slug khác nếu có
// };

// Có thể thêm các hằng số khác nếu cần thiết
// Ví dụ: Regex patterns, API error codes mapping to messages, etc.