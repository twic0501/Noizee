// src/components/products/ProductGrid.jsx
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';

function ProductGrid({ products = [], loading = false, error = null }) {
  if (loading) {
    // Hiển thị skeleton loading hoặc spinner cho grid
    return (
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {[...Array(8)].map((_, index) => ( // Hiện 8 skeleton cards
          <Col key={index}>
            <div className="card placeholder-glow h-100 border-0 shadow-sm">
                <div className="placeholder ratio ratio-1x1 card-img-top"></div>
                <div className="card-body">
                    <span className="placeholder col-8 mb-1"></span>
                    <span className="placeholder col-5 mb-2"></span>
                    <span className="placeholder col-10"></span>
                     <div className="d-flex justify-content-between mt-2">
                        <span className="placeholder col-2"></span>
                         <span className="placeholder col-4"></span>
                    </div>
                </div>
            </div>
          </Col>
        ))}
      </Row>
    );
  }

  if (error) {
    // Hiển thị lỗi nếu không load được sản phẩm
    // (Component cha thường đã xử lý lỗi này)
    return null; // Hoặc <AlertMessage>...</AlertMessage>
  }

  if (!products || products.length === 0) {
    return <p className="text-center text-muted">No products found matching your criteria.</p>;
  }

  return (
    <Row xs={1} sm={2} md={3} lg={4} className="g-4"> {/* CSS: Điều chỉnh số cột và khoảng cách (g-4) */}
      {products.map((product) => (
        <Col key={product.product_id}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
}

export default ProductGrid;