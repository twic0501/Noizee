// src/utils/formatters.js
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale'; // Tiếng Việt cho date-fns

// Định dạng tiền tệ Việt Nam
export const formatCurrency = (amount, fallback = 'N/A') => {
  const number = Number(amount);
  if (isNaN(number) || amount === null || amount === undefined) {
    return fallback;
  }
  try {
      return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  } catch (e) {
      console.error("Currency formatting error:", e);
      return `${amount} VND`; // Fallback đơn giản nếu có lỗi
  }
};

// Helper kiểm tra và parse ngày giờ an toàn hơn
const parseDateTimeSafe = (dateTimeInput) => {
    if (!dateTimeInput) return null;

    if (dateTimeInput instanceof Date && isValid(dateTimeInput)) {
        return dateTimeInput;
    }
    if (typeof dateTimeInput === 'number') {
        const dateFromTimestamp = new Date(dateTimeInput);
        return isValid(dateFromTimestamp) ? dateFromTimestamp : null;
    }
    if (typeof dateTimeInput === 'string') {
        let date = parseISO(dateTimeInput);
        if (isValid(date)) return date;
        if (dateTimeInput.length === 19 && dateTimeInput.includes('T') && !dateTimeInput.endsWith('Z')) {
             date = parseISO(dateTimeInput + 'Z'); // Coi là UTC nếu không có offset
             if (isValid(date)) return date;
        }
    }
    console.warn(`Could not safely parse date/time:`, dateTimeInput);
    return null;
};

// Định dạng ngày (ví dụ: 25/04/2025)
export const formatDate = (dateInput, fallback = 'N/A') => {
  const date = parseDateTimeSafe(dateInput);
  if (!date) return fallback;
  try {
    return format(date, 'P', { locale: vi }); // 'P' -> dd/MM/yyyy cho 'vi'
  } catch (error) {
    console.error("Error formatting date:", dateInput, error);
    return fallback;
  }
};

// Định dạng ngày giờ đầy đủ (ví dụ: 14:52:01, 25/04/2025)
export const formatDateTime = (dateTimeInput, fallback = 'N/A') => {
    const date = parseDateTimeSafe(dateTimeInput);
    if (!date) return fallback;
    try {
        return format(date, 'Pp', { locale: vi }); // 'Pp' -> dd/MM/yyyy, HH:mm:ss cho 'vi'
    } catch (error) {
        console.error("Error formatting datetime:", dateTimeInput, error);
        return fallback;
    }
};

// Viết hoa chữ cái đầu tiên của chuỗi
export const capitalizeFirstLetter = (string) => {
    if (!string || typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// Rút gọn chuỗi dài
export const truncateString = (str, num = 50) => {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
};

// Hàm lấy URL đầy đủ của ảnh, có xử lý placeholder
export const getFullImageUrl = (imgPath) => {
    const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
    const defaultPlaceholder = '/images/placeholder.png'; // <<<< ĐÃ CÓ Ở ĐÂY

    if (!imgPath || typeof imgPath !== 'string' || imgPath.trim() === '') {
        return defaultPlaceholder; // Sẽ trả về cái này
    }

    // Nếu imgPath đã là một URL đầy đủ (bao gồm cả data URL)
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) {
        return imgPath;
    }

    // Nếu imgPath là một đường dẫn tương đối từ thư mục gốc của backend (ví dụ: /uploads/products/image.jpg)
    if (imgPath.startsWith('/')) {
        // Đảm bảo không có hai dấu // khi nối chuỗi
        const formattedBaseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
        return `${formattedBaseUrl}${imgPath}`;
    }

    // Trường hợp khác (ví dụ: chỉ tên file mà không có path) -> có thể coi là lỗi hoặc trả về placeholder
    console.warn(`Unknown or relative image path format for "${imgPath}", returning placeholder. Ensure path starts with '/' if it's from backend root.`);
    return defaultPlaceholder;
};