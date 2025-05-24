// src/components/product/ProductGrid.jsx
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

// Skeleton Card (có thể tách ra component riêng nếu muốn)
const SkeletonCard = () => (
  <Col>
    <div className="card placeholder-glow h-100 border-0 shadow-sm product-card">
      <div className="placeholder ratio product-image-wrapper" style={{ aspectRatio: '3 / 4' }}>
      </div>
      <div className="card-body d-flex flex-column p-3">
        <span className="placeholder col-8 mb-1 bg-secondary"></span>
        <span className="placeholder col-5 mb-2 bg-secondary"></span>
        <div className="d-flex mb-2">
            <span className="placeholder col-2 me-1 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
            <span className="placeholder col-2 me-1 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
            <span className="placeholder col-2 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
        </div>
        <div className="d-flex mt-auto">
          <span className="placeholder col-12 bg-dark" style={{height: '30px', borderRadius: '4px'}}></span>
        </div>
      </div>
    </div>
  </Col>
);

function ProductGrid({ products = [], loading = false, error = null, itemsPerRow = { xs: 1, sm: 2, md: 3, lg: 4 }, skeletonCount = 8 }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK

  if (loading) {
    return (
      <Row xs={itemsPerRow.xs} sm={itemsPerRow.sm} md={itemsPerRow.md} lg={itemsPerRow.lg} className="g-3 g-md-4">
        {[...Array(skeletonCount)].map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </Row>
    );
  }

  if (error) {
    console.error("Error in ProductGrid:", error);
    // Sử dụng key dịch cho thông báo lỗi
    return <AlertMessage variant="warning">{t('productGrid.errorLoading')}</AlertMessage>;
  }

  if (!products || products.length === 0) {
    // Sử dụng key dịch cho thông báo không có sản phẩm
    return <AlertMessage variant="info">{t('productGrid.noProductsFound')}</AlertMessage>;
  }

  return (
    <Row xs={itemsPerRow.xs} sm={itemsPerRow.sm} md={itemsPerRow.md} lg={itemsPerRow.lg} className="g-3 g-md-4 product-grid-row">
      {products.map((product) => (
        product && product.product_id ? (
          <Col key={product.product_id} className="d-flex">
            <ProductCard product={product} />
          </Col>
        ) : null
      ))}
    </Row>
  );
}
export default ProductGrid;