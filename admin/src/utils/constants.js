    // admin-frontend/src/utils/constants.js

    // Pagination
    export const DEFAULT_PAGE_LIMIT = 10;
    export const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];

    // Order Statuses
    export const ORDER_STATUS = {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        SHIPPED: 'Shipped',
        DELIVERED: 'Delivered',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
    };
    export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

    export const STATUS_COLORS = {
        [ORDER_STATUS.PENDING]: 'secondary',
        [ORDER_STATUS.PROCESSING]: 'primary',
        [ORDER_STATUS.SHIPPED]: 'info',
        [ORDER_STATUS.DELIVERED]: 'success',
        [ORDER_STATUS.COMPLETED]: 'success',
        [ORDER_STATUS.CANCELLED]: 'danger',
    };

    export const PLACEHOLDER_IMAGE_PATH = '/images/placeholder.png'; // Đường dẫn đến ảnh placeholder trong public/images

    // LocalStorage Keys for Admin
    export const ADMIN_TOKEN_KEY = 'admin_token';
    export const ADMIN_IS_ADMIN_KEY = 'admin_isAdmin';
    export const ADMIN_ID_KEY = 'admin_id';
    export const ADMIN_NAME_KEY = 'admin_name';
    export const ADMIN_USERNAME_KEY = 'admin_username'; // Thêm nếu bạn lưu username
    export const ADMIN_EMAIL_KEY = 'admin_email';       // Thêm nếu bạn lưu email
    export const ADMIN_LANGUAGE_KEY = 'admin_preferred_lang'; // Key cho ngôn ngữ admin chọn

    // Blog Statuses (ví dụ)
    export const BLOG_POST_STATUS = {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        ARCHIVED: 'archived',
    };
    export const BLOG_POST_STATUS_LIST = Object.values(BLOG_POST_STATUS);

    // Blog Visibility (ví dụ)
    export const BLOG_POST_VISIBILITY = {
        PUBLIC: 'public',
        PRIVATE: 'private',
        MEMBERS_ONLY: 'members_only',
    };
    export const BLOG_POST_VISIBILITY_LIST = Object.values(BLOG_POST_VISIBILITY);
    