// src/i18nUser.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { USER_LANGUAGE_KEY, DEFAULT_USER_LANGUAGE } from './utils/constants'; // Đảm bảo import đúng

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV, // OK cho Vite
    supportedLngs: ['vi', 'en'],
    fallbackLng: DEFAULT_USER_LANGUAGE, // 'vi'
    
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: USER_LANGUAGE_KEY, // 'user_preferred_lang'
      lookupFromPathIndex: 0, 
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Đường dẫn này phải đúng
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    ns: ['translation'],
    defaultNS: 'translation',

    react: {
      useSuspense: true, // Đảm bảo main.jsx có <React.Suspense>
    }
  });

export default i18n;