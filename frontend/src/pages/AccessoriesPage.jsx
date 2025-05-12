// src/pages/AccessoriesPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Component này sẽ chỉ làm nhiệm vụ điều hướng đến CollectionsPage với filter phù hợp
function AccessoriesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Thay 'accessories_category_id' bằng ID thực tế của category "Phụ kiện"
    // Hoặc nếu bạn dùng slug: '/collections/accessories-slug'
    const accessoriesCategoryId = 'ID_CUA_CATEGORY_PHU_KIEN'; // Ví dụ ID là 3

    // Điều hướng đến CollectionsPage với query parameter cho category
    // Hoặc bạn có thể dùng navigate('/collections/accessories-slug') nếu route của bạn hỗ trợ slug
    navigate(`/collections?categoryId=${accessoriesCategoryId}`, { replace: true });
  }, [navigate]);

  // Component này sẽ không render gì cả vì nó chỉ điều hướng
  // Hoặc bạn có thể hiển thị một LoadingSpinner ngắn hạn
  return null;
  // Hoặc:
  // import LoadingSpinner from '../components/common/LoadingSpinner';
  // return <LoadingSpinner message="Đang chuyển đến trang Phụ kiện..." />;
}

export default AccessoriesPage;