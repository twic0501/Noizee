// src/pages/ProductDetailPage.jsx
import React, { useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Image, Button, Badge, Breadcrumb } from 'react-bootstrap';
import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/queries/productQueries';
import { AlertMessage, LoadingSpinner } from '@noizee/ui-components';
import SizeSelector from '../components/product/SizeSelector';
import ColorSelector from '../components/product/ColorSelector';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '@noizee/shared-utils';
// Import CSS cho trang chi tiết nếu cần
// import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams(); // Lấy ID từ URL
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1); // State cho số lượng

  const { loading, error, data } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) return <LoadingSpinner message="Loading product..." />;
  if (error) return <Container><AlertMessage variant="danger">Error loading product: {error.message}</AlertMessage></Container>;
  const product = data?.product;
  if (!product) return <Container><AlertMessage variant="warning">Product not found.</AlertMessage></Container>;

  const isOutOfStock = product.product_stock <= 0 && (!product.sizes || product.sizes.length === 0) && (!product.colors || product.colors.length === 0);
   // TODO: Cập nhật logic isOutOfStock dựa trên size/color đã chọn

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert("Please select size and color.");
      return;
    }
     // TODO: Kiểm tra tồn kho của size/color/số lượng đã chọn
    addItem(product, quantity, selectedSize, selectedColor);
     alert(`${quantity} x ${product.product_name} added to cart! (Size: ${selectedSize.size_name}, Color: ${selectedColor.color_name})`);
  };

  const handleQuantityChange = (change) => {
     setQuantity(prev => Math.max(1, prev + change)); // Đảm bảo số lượng >= 1
  }

  return (
    <Container className="my-4 my-md-5 product-detail-page"> {/* CSS */}
      {/* Breadcrumb */}
      <Breadcrumb listProps={{ className: "breadcrumb-style" }}> {/* CSS */}
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/collections" }}>Collections</Breadcrumb.Item>
          {product.category && (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/collections?category=${product.category.category_id}` }}>
                  {product.category.category_name}
              </Breadcrumb.Item>
          )}
          <Breadcrumb.Item active>{product.product_name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4 g-lg-5">
        {/* Cột Ảnh Sản Phẩm */}
        <Col md={6} lg={7}>
          {/* TODO: Thêm thư viện gallery ảnh nếu có nhiều ảnh */}
          <Image
            src={product.imageUrl || '/images/placeholder.png'}
            alt={product.product_name}
            fluid // Responsive
            className="product-main-image shadow-sm" /* CSS */
          />
           {/* TODO: Hiển thị ảnh thumbnails nếu có */}
        </Col>

        {/* Cột Thông Tin & Mua Hàng */}
        <Col md={6} lg={5}>
          {product.isNewArrival && !isOutOfStock && <Badge bg="danger" className="mb-2">New Arrival</Badge>}
          <h1 className="product-title">{product.product_name}</h1> {/* CSS: Archivo Black */}

          <p className="product-price h3"> {/* CSS: Archivo Black */}
            {formatCurrency(product.product_price)}
          </p>

          <hr />

          {/* Lựa chọn Size & Màu */}
           <div className="mb-3">
             <SizeSelector
                sizes={product.sizes || []}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
             />
           </div>
            <div className="mb-3">
               <ColorSelector
                    colors={product.colors || []}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                />
            </div>


          {/* Lựa chọn Số Lượng */}
            {!isOutOfStock && (
                <div className="mb-3 d-flex align-items-center quantity-selector"> {/* CSS */}
                     <span className="me-3 qty-label">Quantity:</span> {/* CSS */}
                     <Button variant="outline-dark" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</Button>
                     <span className="mx-2 quantity-value">{quantity}</span> {/* CSS */}
                     <Button variant="outline-dark" size="sm" onClick={() => handleQuantityChange(1)} >+</Button> {/* TODO: Disable nếu vượt stock */}
                 </div>
            )}

          {/* Nút Add to Cart / Sold Out */}
          <div className="d-grid gap-2">
            {isOutOfStock ? (
              <Button variant="secondary" disabled size="lg">Sold Out</Button>
            ) : (
              <Button
                variant="dark"
                size="lg"
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor} /* CSS: Style nút */
              >
                 <i className="bi bi-cart-plus me-2"></i> Add to Cart
              </Button>
            )}
          </div>

          {/* Mô tả Sản Phẩm */}
          <div className="mt-4 product-description"> {/* CSS */}
            <h5 className="section-sub-title">Description</h5> {/* CSS: Oswald */}
            <p>{product.product_description || 'No description available.'}</p> {/* CSS: Roboto Mono */}
          </div>

           {/* TODO: Thêm các thông tin khác: details, shipping info... */}

        </Col>
      </Row>

      {/* TODO: Phần Related Products */}
      {/* <Row><Col><h2>You Might Also Like</h2><ProductGrid products={...} /></Col></Row> */}
    </Container>
  );
}

export default ProductDetailPage;