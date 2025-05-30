import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

i18n
  .use(LanguageDetector) // Phát hiện ngôn ngữ người dùng
  .use(initReactI18next) // Kết nối i18next với react
  .init({
    resources,
    fallbackLng: 'vi', // Ngôn ngữ mặc định nếu không tìm thấy hoặc ngôn ngữ người dùng không được hỗ trợ
    debug: import.meta.env.DEV, // Bật chế độ debug trong môi trường development
    interpolation: {
      escapeValue: false, // React đã tự bảo vệ khỏi XSS
    },
    detection: {
      // Thứ tự và cách phát hiện ngôn ngữ
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // Lưu ngôn ngữ đã chọn vào localStorage
    },
  });

export default i18n;