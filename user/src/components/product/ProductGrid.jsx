import React from 'react';
import ProductCard from './ProductCard'; // Component ProductCard đã tạo
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next';

const ProductGrid = ({
  products,
  loading,
  error,
  className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6", // Default grid classes
  cardClassName = "" // Optional classes for individual cards
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" message={t('products.loadingProducts', 'Đang tải sản phẩm...')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8">
        <AlertMessage type="error" title={t('products.errorLoadingTitle', 'Lỗi tải sản phẩm')} message={error.message} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="my-8 text-center">
        <AlertMessage type="info" message={t('products.noProductsFound', 'Không tìm thấy sản phẩm nào phù hợp.')} />
        {/* Có thể thêm gợi ý hoặc link quay lại */}
      </div>
    );
  }

  return (
  <div className={className}>
    {products.map((product) => (
      // Đảm bảo product.product_id luôn tồn tại và là duy nhất
      <ProductCard key={product.product_id} product={product} className={cardClassName} />
    ))}
  </div>
);
};

export default ProductGrid;