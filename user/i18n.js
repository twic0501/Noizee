// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Import các file translation
import translationEN from '../user/src/locales/en/translation.json';
import translationVI from '../user/src/locales/vi/translation.json';

const resources = {
  en: { translation: translationEN },
  vi: { translation: translationVI },
};

i18n
  .use(LanguageDetector) // Phát hiện ngôn ngữ trình duyệt
  .use(initReactI18next) // Kết nối i18next với React
  .init({
    resources,
    fallbackLng: 'vi', // Ngôn ngữ mặc định nếu không phát hiện được
    debug: import.meta.env.DEV, // true ở chế độ dev
    interpolation: {
      escapeValue: false, // React đã tự escape rồi
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });
export default i18n;