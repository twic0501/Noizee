    // src/i18n.js
    // (Dành cho cả admin-frontend và user-frontend. Nếu là project riêng, tạo file này ở mỗi project)
    import i18n from 'i18next';
    import { initReactI18next } from 'react-i18next';
    import LanguageDetector from 'i18next-browser-languagedetector';

    // Import các file dịch thuật (bạn sẽ tạo các file này ở bước tiếp theo)
    // Ví dụ cho user-frontend
    import translationEN_user from './locales/en/translation.json';
    import translationVI_user from './locales/vi/translation.json';

    // Ví dụ cho admin-frontend (nếu dùng chung file i18n.js, bạn có thể merge hoặc dùng namespace)
    // Hoặc nếu admin-frontend có file i18n.js riêng, thì import file dịch của admin ở đó.
    // Giả sử đây là file i18n.js cho user-frontend trước.
    // Nếu bạn muốn dùng chung, chúng ta có thể cấu hình namespaces.
    // Hiện tại, tôi sẽ làm ví dụ cho một frontend trước, bạn có thể áp dụng tương tự.

    const resources = {
      en: {
        translation: translationEN_user, // Sẽ được tạo ở bước 1.3
      },
      vi: {
        translation: translationVI_user, // Sẽ được tạo ở bước 1.3
      },
    };

    i18n
      .use(LanguageDetector) // Tự động phát hiện ngôn ngữ trình duyệt
      .use(initReactI18next) // Kết nối i18next với React
      .init({
        resources,
        fallbackLng: 'vi', // Ngôn ngữ mặc định nếu không phát hiện được hoặc ngôn ngữ hiện tại không có bản dịch
        debug: process.env.NODE_ENV === 'development', // Bật chế độ debug ở môi trường development
        interpolation: {
          escapeValue: false, // React đã tự bảo vệ khỏi XSS
        },
        detection: {
          // Thứ tự phát hiện ngôn ngữ: localStorage -> navigator (trình duyệt) -> htmlTag
          order: ['localStorage', 'navigator', 'htmlTag'],
          // Cache lựa chọn ngôn ngữ của người dùng vào localStorage
          caches: ['localStorage'],
        },
      });

    export default i18n;
    