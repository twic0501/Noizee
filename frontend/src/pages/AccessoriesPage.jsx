// src/pages/AccessoriesPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/common/LoadingSpinner'; // LoadingSpinner đã được dịch

function AccessoriesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const params = useParams();
  // Lấy ngôn ngữ hiện tại từ URL (nếu có) hoặc từ i18next, fallback về 'vi'
  const currentLang = params.lang || i18n.language || 'vi';

  useEffect(() => {
    // Sử dụng key dịch cho slug nếu bạn muốn slug thay đổi theo ngôn ngữ.
    // Hoặc một slug cố định nếu "accessories" là chung cho mọi ngôn ngữ và CollectionsPage xử lý việc tìm categoryId.
    const accessoriesTargetSlug = t('routes.accessoriesSlug', { defaultValue: 'accessories' });

    // Điều hướng đến trang collections với slug (hoặc categoryId nếu bạn dùng cách đó)
    // Đảm bảo CollectionsPage có thể xử lý slug này để filter đúng category "Phụ kiện"
    navigate(`/${currentLang}/collections/${accessoriesTargetSlug}`, { replace: true });
  }, [navigate, currentLang, t]);

  // Hiển thị thông báo loading trong khi điều hướng
  return <LoadingSpinner message={t('accessoriesPage.redirectingMessage')} />;
}

export default AccessoriesPage;
