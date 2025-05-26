/**
 * Formats a number as currency.
 * @param {number | string | null | undefined} amount - The amount to format.
 * @param {string} [currency='VND'] - The currency code (e.g., 'USD', 'VND').
 * @param {string} [locale='vi-VN'] - The locale for formatting (e.g., 'en-US', 'vi-VN').
 * @returns {string} The formatted currency string or a fallback.
 */
export const formatPrice = (amount, currency = 'VND', locale = 'vi-VN') => {
  const numAmount = Number(amount);
  if (amount === null || amount === undefined || isNaN(numAmount)) {
    return 'N/A'; // Hoặc một giá trị mặc định khác như 'Liên hệ'
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: (currency === 'VND' || currency === 'JPY') ? 0 : 2, // Điều chỉnh số lẻ tùy currency
      maximumFractionDigits: (currency === 'VND' || currency === 'JPY') ? 0 : 2,
    }).format(numAmount);
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${numAmount} ${currency}`; // Fallback đơn giản
  }
};

/**
 * Formats a date string or Date object.
 * @param {string | Date | number | null | undefined} dateInput - The date to format.
 * @param {string} [locale='vi-VN'] - The locale.
 * @param {Intl.DateTimeFormatOptions} [options] - Formatting options.
 * @returns {string} The formatted date string or empty if input is invalid.
 */
export const formatDate = (dateInput, locale = 'vi-VN', options) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    // Kiểm tra nếu date không hợp lệ (ví dụ: new Date('invalid string'))
    if (isNaN(date.getTime())) {
        console.warn("Invalid dateInput for formatDate:", dateInput);
        return ''; // Hoặc giá trị fallback
    }
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
    };
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    // Trả về ngày tháng gốc nếu không phải là object Date, hoặc chuỗi rỗng
    return typeof dateInput === 'string' ? dateInput : ''; 
  }
};

/**
 * Capitalizes the first letter of a string.
 * @param {string | null | undefined} str - The string to capitalize.
 * @returns {string} The capitalized string or empty string.
 */
export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); // Có thể muốn toLowerCase phần còn lại
};

/**
 * Truncates text to a specified maximum length, adding an ellipsis.
 * @param {string | null | undefined} text - The text to truncate.
 * @param {number} maxLength - The maximum length before truncating.
 * @returns {string} The truncated text or original text if shorter.
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trimEnd() + '...';
};

/**
 * Formats a number with thousand separators.
 * @param {number | string | null | undefined} number - The number to format.
 * @param {string} [locale='vi-VN'] - The locale for formatting.
 * @returns {string} The formatted number string or a fallback.
 */
export const formatNumber = (number, locale = 'vi-VN') => {
  const num = Number(number);
  if (number === null || number === undefined || isNaN(num)) {
    return 'N/A';
  }
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch (error) {
    console.error("Error formatting number:", error);
    return String(num);
  }
};

// Thêm các hàm formatter khác nếu cần (ví dụ: formatPhoneNumber, getFileExtension, etc.)