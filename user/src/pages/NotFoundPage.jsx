// user/src/pages/NotFoundPage.jsx (Placeholder)
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">{t('notFound.message', 'Trang bạn tìm kiếm không tồn tại.')}</p>
      <Link to="/" className="text-indigo-600 hover:underline">{t('notFound.goHome', 'Về trang chủ')}</Link>
    </div>
  );
};
export default NotFoundPage;