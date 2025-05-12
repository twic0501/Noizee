// src/components/product/ProductGrid.jsx
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import AlertMessage from '../common/AlertMessage'; // Để hiển thị thông báo không có sản phẩm

// Skeleton Card (có thể tách ra component riêng nếu muốn)
const SkeletonCard = () => (
  <Col>
    <div className="card placeholder-glow h-100 border-0 shadow-sm product-card"> {/* Thêm class product-card */}
      <div className="placeholder ratio product-image-wrapper" style={{ aspectRatio: '3 / 4' }}> {/* Giữ tỉ lệ ảnh */}
        {/* <div className="product-card-img"></div> */} {/* Không cần div con này nữa */}
      </div>
      <div className="card-body d-flex flex-column p-3">
        <span className="placeholder col-8 mb-1 bg-secondary"></span>
        <span className="placeholder col-5 mb-2 bg-secondary"></span>
        {/* Giả lập selectors */}
        <div className="d-flex mb-2">
            <span className="placeholder col-2 me-1 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
            <span className="placeholder col-2 me-1 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
            <span className="placeholder col-2 bg-light" style={{height: '20px', borderRadius: '10px'}}></span>
        </div>
        <div className="d-flex mt-auto"> {/* Đẩy nút xuống dưới */}
          <span className="placeholder col-12 bg-dark" style={{height: '30px', borderRadius: '4px'}}></span>
        </div>
      </div>
    </div>
  </Col>
);

function ProductGrid({ products = [], loading = false, error = null, itemsPerRow = { xs: 1, sm: 2, md: 3, lg: 4 }, skeletonCount = 8 }) {
  if (loading) {
    return (
      <Row xs={itemsPerRow.xs} sm={itemsPerRow.sm} md={itemsPerRow.md} lg={itemsPerRow.lg} className="g-3 g-md-4"> {/* g-4 cho khoảng cách lớn hơn */}
        {[...Array(skeletonCount)].map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </Row>
    );
  }

  if (error) {
    // Component cha thường sẽ xử lý lỗi này và không render ProductGrid,
    // nhưng để phòng trường hợp, có thể trả về null hoặc một thông báo lỗi nhỏ.
    // Hoặc bạn có thể throw error để ErrorBoundary (nếu có) bắt.
    console.error("Error in ProductGrid:", error);
    return <AlertMessage variant="warning">Could not display products at the moment.</AlertMessage>;
  }

  if (!products || products.length === 0) {
    return <AlertMessage variant="info">Không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn.</AlertMessage>;
  }

  return (
    <Row xs={itemsPerRow.xs} sm={itemsPerRow.sm} md={itemsPerRow.md} lg={itemsPerRow.lg} className="g-3 g-md-4 product-grid-row"> {/* CSS */}
      {products.map((product) => (
        // Thêm kiểm tra product và product_id trước khi render ProductCard
        product && product.product_id ? (
          <Col key={product.product_id} className="d-flex"> {/* d-flex để các card trong 1 hàng cao bằng nhau nếu nội dung khác nhau */}
            <ProductCard product={product} />
          </Col>
        ) : null
      ))}
    </Row>
  );
}
// Thêm CSS nếu cần cho .product-grid-row
// ví dụ:
// .product-grid-row .col {
//     display: flex; /* Giúp các ProductCard trong cùng một hàng có chiều cao bằng nhau */
//     align-items: stretch; /* Đảm bảo card con sẽ kéo dài theo chiều cao của Col */
// }
// .product-grid-row .product-card {
//     width: 100%; /* Đảm bảo card chiếm hết chiều rộng của Col */
// }
export default ProductGrid;