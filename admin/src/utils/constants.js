// src/utils/constants.js

// Endpoints (nên lấy từ .env, nhưng có thể có một số hằng số URL tĩnh ở đây nếu không nhạy cảm)
// export const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql';
// export const REST_API_ENDPOINT = import.meta.env.VITE_REST_API_ENDPOINT || 'http://localhost:5000/api';

// Pagination
export const DEFAULT_PAGE_LIMIT = 10;
export const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100]; // Các tùy chọn cho select limit

// Order Statuses (Khớp với backend và các lựa chọn trong UI)
export const ORDER_STATUS = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed', // Có thể gộp Delivered và Completed
    CANCELLED: 'Cancelled',
    // Thêm các trạng thái khác nếu cần
};

// Mảng các giá trị status để dễ dàng lặp qua (ví dụ trong dropdown filter)
export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

// (Tùy chọn) Màu sắc cho status badge (có thể dùng trong OrderStatusBadge.jsx của admin)
// Nếu bạn có OrderStatusBadge.jsx riêng cho admin, nó có thể dùng constants này.
export const STATUS_COLORS = {
    [ORDER_STATUS.PENDING]: 'secondary',    // Hoặc 'warning' tùy theo UI
    [ORDER_STATUS.PROCESSING]: 'primary',
    [ORDER_STATUS.SHIPPED]: 'info',
    [ORDER_STATUS.DELIVERED]: 'success',
    [ORDER_STATUS.COMPLETED]: 'success',    // Giống Delivered
    [ORDER_STATUS.CANCELLED]: 'danger',
    // DEFAULT: 'light' // Cho các trạng thái không xác định
};

// Trong src/utils/constants.js
export const PLACEHOLDER_IMAGE_PATH = '/images/placeholder.png';
// LocalStorage Keys (Cho Admin - để phân biệt với User Frontend nếu chạy cùng domain)
export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_IS_ADMIN_KEY = 'admin_isAdmin'; // Lưu 'true'/'false'
export const ADMIN_ID_KEY = 'admin_id';
export const ADMIN_NAME_KEY = 'admin_name';
// Thêm các key khác nếu cần, ví dụ:
// export const ADMIN_USERNAME_KEY = 'admin_username';
// export const ADMIN_EMAIL_KEY = 'admin_email';

// Các hằng số khác của ứng dụng Admin
// Ví dụ:
// export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
// export const ROLES = { ADMIN: 'admin', EDITOR: 'editor' }; // Nếu có quản lý role chi tiết hơn