// src/utils/formatters.js
import { format, parseISO, isValid } from 'date-fns';
// Import các locale bạn cần
import { enUS as dateLocaleEn, vi as dateLocaleVi } from 'date-fns/locale';
import { DEFAULT_USER_LANGUAGE } from './constants'; // Import ngôn ngữ mặc định

// Map mã ngôn ngữ với locale object của date-fns
const dateFnsLocales = {
  en: dateLocaleEn,
  vi: dateLocaleVi,
};

export const formatCurrency = (amount, lang = DEFAULT_USER_LANGUAGE, fallback = 'N/A') => {
  const number = Number(amount);
  if (isNaN(number) || amount === null || amount === undefined) {
    return fallback;
  }
  // Xác định mã tiền tệ và locale string dựa trên ngôn ngữ
  const currencyCode = lang === 'en' ? 'USD' : 'VND';
  const localeString = lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return number.toLocaleString(localeString, { style: 'currency', currency: currencyCode });
  } catch (e) {
    console.error("Currency formatting error:", e);
    return `${amount} ${currencyCode}`; // Fallback đơn giản
  }
};

// Helper kiểm tra và parse ngày giờ một cách an toàn hơn
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
    // Fallback cho trường hợp ngày không có T và Z
    if (!dateTimeInput.includes('T') && !dateTimeInput.includes('Z') && dateTimeInput.length === 10) {
        date = parseISO(dateTimeInput + 'T00:00:00Z');
         if (isValid(date)) return date;
    }
    return null;
  }
  return null;
};

export const formatDate = (dateInput, lang = DEFAULT_USER_LANGUAGE, fallback = 'N/A') => {
  const date = parseDateTimeSafe(dateInput);
  if (!date) return fallback;
  try {
    return format(date, 'P', { locale: dateFnsLocales[lang] || dateFnsLocales[DEFAULT_USER_LANGUAGE] });
  } catch (error) {
    console.error("Error formatting date:", dateInput, error);
    return fallback;
  }
};

export const formatDateTime = (dateTimeInput, lang = DEFAULT_USER_LANGUAGE, fallback = 'N/A') => {
  const date = parseDateTimeSafe(dateTimeInput);
  if (!date) return fallback;
  try {
    return format(date, 'Pp', { locale: dateFnsLocales[lang] || dateFnsLocales[DEFAULT_USER_LANGUAGE] });
  } catch (error) {
    console.error("Error formatting datetime:", dateTimeInput, error);
    return fallback;
  }
};

export const truncateString = (str, num = 50) => {
  if (!str) return '';
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

export const getFullImageUrl = (imgPath) => {
 const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
 const defaultPlaceholder = '/images/placeholder.png';

 if (!imgPath || typeof imgPath !== 'string' || imgPath.trim() === '') {
    return defaultPlaceholder;
 }
 if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) {
    return imgPath;
 }
 if (imgPath.startsWith('/')) {
    const formattedBaseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    return `${formattedBaseUrl}${imgPath}`;
 }
 console.warn(`getFullImageUrl: Unknown or relative image path format for "${imgPath}", returning placeholder.`);
 return defaultPlaceholder;
};

export const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};