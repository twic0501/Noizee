// src/components/product/ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard'; // Đảm bảo ProductCard đã được cập nhật như các lần trước
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next';

const ProductGrid = ({
  products,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  // Hiển thị loading spinner nếu đang tải và chưa có sản phẩm nào
  if (loading && (!products || products.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 my-5"> {/* Thêm my-5 cho khoảng cách */}
        <LoadingSpinner message={t('products.loadingProducts', 'Đang tải sản phẩm...')} />
      </div>
    );
  }

  // Hiển thị thông báo lỗi nếu có lỗi
  if (error) {
    return (
      <div className="my-4">
        <AlertMessage type="error" title={t('products.errorLoadingTitle', 'Lỗi tải sản phẩm')} message={error.message} />
      </div>
    );
  }

  // Hiển thị thông báo nếu không có sản phẩm nào
  if (!products || products.length === 0) {
    return (
      <div className="my-4 text-center">
         <AlertMessage type="info" message={t('products.noProductsFound', 'Không tìm thấy sản phẩm nào phù hợp.')} />
      </div>
    );
  }

  // Hiển thị lưới sản phẩm
  return (
    // Sử dụng Bootstrap row với khoảng cách (gap) g-2 (nhỏ) hoặc g-3 (vừa)
    // Bạn có thể điều chỉnh g-2, g-sm-2, g-md-3, g-lg-3 tùy theo ý muốn
    // g-*: gap cho tất cả các kích thước
    // g-sm-*: gap từ màn hình sm trở lên
    // g-md-*: gap từ màn hình md trở lên
    // g-lg-*: gap từ màn hình lg trở lên
    // Ví dụ: 'row g-2 g-lg-3' nghĩa là gap nhỏ cho mobile, gap lớn hơn cho desktop
    <div className="row g-2 g-lg-3"> {/* Điều chỉnh gap ở đây */}
      {products.map((product) => (
        // col-6: 2 sản phẩm/hàng trên màn hình nhỏ nhất (extra small & small)
        // col-md-4: 3 sản phẩm/hàng trên màn hình trung bình (medium)
        // col-lg-3: 4 sản phẩm/hàng trên màn hình lớn (large & extra large)
        // d-flex align-items-stretch: Giúp các ProductCard trong cùng một hàng có chiều cao bằng nhau
        // mb-2 mb-lg-3: Thêm margin bottom cho mỗi cột để tạo khoảng cách dọc nếu cần (thay thế cho gap dọc của grid CSS)
        <div
          key={product.product_id || product.id}
          className="col-6 col-md-4 col-lg-3 d-flex align-items-stretch mb-2 mb-lg-3"
        >
          {/* ProductCard nên có class "h-100" để nó chiếm toàn bộ chiều cao của div cột */}
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
