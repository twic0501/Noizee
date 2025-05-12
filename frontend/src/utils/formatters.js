// src/utils/formatters.js
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale'; // Tiếng Việt

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

// Helper kiểm tra và parse ngày giờ một cách an toàn hơn
const parseDateTimeSafe = (dateTimeInput) => {
  if (!dateTimeInput) return null;

  // Nếu đã là đối tượng Date và hợp lệ
  if (dateTimeInput instanceof Date && isValid(dateTimeInput)) {
    return dateTimeInput;
  }

  // Nếu là số (timestamp)
  if (typeof dateTimeInput === 'number') {
    const dateFromTimestamp = new Date(dateTimeInput);
    return isValid(dateFromTimestamp) ? dateFromTimestamp : null;
  }

  // Nếu là chuỗi
  if (typeof dateTimeInput === 'string') {
    // Thử parseISO trực tiếp, date-fns khá linh hoạt
    let date = parseISO(dateTimeInput);
    if (isValid(date)) return date;

    // Nếu chuỗi không có thông tin múi giờ và có dạng YYYY-MM-DDTHH:MM:SS,
    // parseISO có thể hiểu là local time. Để đảm bảo coi là UTC nếu không rõ,
    // bạn có thể thêm 'Z' (nhưng cần cẩn thận vì điều này thay đổi ý nghĩa của thời gian).
    // Đối với ngày tháng từ database, thường đã là UTC hoặc có offset.
    // Ví dụ đơn giản: nếu không có 'Z' và 'T', có thể là ngày thuần túy.
    if (!dateTimeInput.includes('T') && !dateTimeInput.includes('Z') && dateTimeInput.length === 10) {
         // Dạng YYYY-MM-DD
        date = parseISO(dateTimeInput + 'T00:00:00Z'); // Coi là đầu ngày UTC
         if (isValid(date)) return date;
    }
    // Các trường hợp parse phức tạp hơn có thể cần thư viện moment.js hoặc xử lý kỹ hơn
    // console.warn(`Could not reliably parse date string: ${dateTimeInput}`);
    return null;
  }
  return null;
};

// Định dạng ngày (ví dụ: 29/04/2025)
export const formatDate = (dateInput, fallback = 'N/A') => {
  const date = parseDateTimeSafe(dateInput);
  if (!date) return fallback;
  try {
    // 'P' là định dạng ngày ngắn gọn theo locale (ví dụ: dd/MM/yyyy cho vi)
    return format(date, 'P', { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", dateInput, error);
    return fallback;
  }
};

// Định dạng ngày giờ đầy đủ (ví dụ: 29/04/2025, 14:51:09)
export const formatDateTime = (dateTimeInput, fallback = 'N/A') => {
  const date = parseDateTimeSafe(dateTimeInput);
  if (!date) return fallback;
  try {
    // 'Pp' là định dạng ngày + giờ ngắn gọn theo locale
    return format(date, 'Pp', { locale: vi });
  } catch (error) {
    console.error("Error formatting datetime:", dateTimeInput, error);
    return fallback;
  }
};

// Rút gọn chuỗi và thêm dấu "..."
export const truncateString = (str, num = 50) => {
  if (!str) return '';
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

// Lấy URL đầy đủ của ảnh, có fallback về placeholder
export const getFullImageUrl = (imgPath) => {
 const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
 const defaultPlaceholder = '/images/placeholder.png'; // Đảm bảo file này tồn tại trong public/images của frontend

 if (!imgPath || typeof imgPath !== 'string' || imgPath.trim() === '') {
    // console.log("getFullImageUrl: imgPath is empty or invalid, returning placeholder."); // DEBUG
return defaultPlaceholder;
 }

if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) {
    // console.log("getFullImageUrl: imgPath is already a full URL:", imgPath); // DEBUG
 return imgPath;
 }

if (imgPath.startsWith('/')) {
const formattedBaseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const finalUrl = `${formattedBaseUrl}${imgPath}`; // <<<< SỬA LẠI ĐÚNG CÚ PHÁP TEMPLATE LITERAL
    // console.log(`getFullImageUrl: Constructed URL: ${finalUrl} (from base: ${formattedBaseUrl} and path: ${imgPath})`); // DEBUG
return finalUrl;
}
console.warn(`getFullImageUrl: Unknown or relative image path format for "${imgPath}", returning placeholder. Ensure path starts with '/' if it's from backend root.`);
return defaultPlaceholder;
};

// Viết hoa chữ cái đầu tiên của mỗi từ trong chuỗi
export const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};