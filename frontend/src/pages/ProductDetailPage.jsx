// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Image, Button, Badge, Breadcrumb, Form, Alert } from 'react-bootstrap';
import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/queries/productQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import SizeSelector from '../components/product/SizeSelector';
import ColorSelector from '../components/product/ColorSelector';
import ImageCarousel from '../components/product/ImageCarousel'; // Nếu dùng carousel
import { useCart } from '../hooks/useCart';
import { formatCurrency, getFullImageUrl } from '../utils/formatters';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../utils/constants';
import './ProductDetailPage.css'; // Tạo file CSS riêng

function ProductDetailPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addToCartMessage, setAddToCartMessage] = useState({ type: '', text: '' });
  const [mainImage, setMainImage] = useState(''); // State cho ảnh chính hiển thị

  const { loading, error, data } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
    variables: { id: productId },
    fetchPolicy: 'cache-and-network',
    onCompleted: (queryData) => {
        if (queryData?.product?.imageUrl) {
            setMainImage(getFullImageUrl(queryData.product.imageUrl));
        } else {
            setMainImage(PLACEHOLDER_PRODUCT_IMAGE);
        }
        // Tự động chọn size/color đầu tiên nếu chỉ có 1 lựa chọn và còn hàng
        const productData = queryData?.product;
        if (productData) {
            if (productData.sizes?.length === 1) {
                const firstSize = productData.sizes[0];
                // Kiểm tra tồn kho của size này (có thể cần check với màu mặc định nếu có)
                 setSelectedSize(firstSize);
            }
            if (productData.colors?.length === 1) {
                const firstColor = productData.colors[0];
                // Kiểm tra tồn kho của màu này (có thể cần check với size mặc định nếu có)
                setSelectedColor(firstColor);
            }
        }
    },
    onError: (err) => {
        console.error("Error fetching product details:", err.message);
    }
  });

  const product = data?.product;
  const inventoryData = useMemo(() => product?.inventory || [], [product?.inventory]);
  const availableSizes = useMemo(() => product?.sizes || [], [product?.sizes]);
  const availableColors = useMemo(() => product?.colors || [], [product?.colors]);

  const getVariantStock = (sizeId, colorId) => {
    if (!inventoryData || inventoryData.length === 0) {
        // Nếu không có variants được định nghĩa trong inventory và sản phẩm có yêu cầu size/color -> hết hàng
        return (availableSizes.length > 0 || availableColors.length > 0) ? 0 : Infinity;
    }
    const variant = inventoryData.find(inv =>
      inv.size_id === (sizeId || null) &&
      inv.color_id === (colorId || null)
    );
    return variant ? variant.quantity : 0;
  };

  const currentVariantStock = useMemo(() => {
    if (!product) return 0;
    // Nếu sản phẩm không có size và color (simple product)
    if (availableSizes.length === 0 && availableColors.length === 0) {
        const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
        return simpleInventory ? simpleInventory.quantity : (inventoryData.length === 0 ? Infinity : 0); // Coi là còn hàng nếu ko có entry cụ thể
    }
    // Nếu có size/color nhưng chưa chọn -> chưa xác định được stock
    if ((availableSizes.length > 0 && !selectedSize) || (availableColors.length > 0 && !selectedColor)) {
        return 0; // Hoặc một giá trị nào đó để biết là chưa chọn đủ
    }
    return getVariantStock(selectedSize?.size_id, selectedColor?.color_id);
  }, [product, selectedSize, selectedColor, inventoryData, availableSizes, availableColors]);


  const isCompletelyOutOfStock = useMemo(() => {
      if (!inventoryData || !product) return true; // Chưa có data thì coi như hết
      if (availableSizes.length === 0 && availableColors.length === 0) { // Simple product
        const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
        return simpleInventory ? simpleInventory.quantity <= 0 : (inventoryData.length > 0 ? true: false); // Hết nếu có entry và <=0, hoặc có entry mà ko khớp. Còn nếu ko có entry nào thì coi là còn.
      }
      // Configurable product
      return inventoryData.length > 0 && inventoryData.every(inv => inv.quantity <= 0);
  }, [inventoryData, product, availableSizes, availableColors]);


  useEffect(() => {
    // Reset message khi thay đổi lựa chọn
    setAddToCartMessage({ type: '', text: '' });
  }, [selectedSize, selectedColor, quantity]);


  const handleAddToCart = () => {
    setAddToCartMessage({ type: '', text: '' }); // Clear previous message
    if (availableSizes.length > 0 && !selectedSize) {
      setAddToCartMessage({ type: 'danger', text: "Vui lòng chọn kích thước." });
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      setAddToCartMessage({ type: 'danger', text: "Vui lòng chọn màu sắc." });
      return;
    }
    if (currentVariantStock < quantity) {
      setAddToCartMessage({ type: 'danger', text: `Rất tiếc, chỉ còn ${currentVariantStock} sản phẩm cho lựa chọn này.` });
      return;
    }
    if (currentVariantStock === 0 && !isCompletelyOutOfStock) {
        setAddToCartMessage({ type: 'danger', text: "Lựa chọn này hiện đã hết hàng."});
        return;
    }
    if (isCompletelyOutOfStock) {
        setAddToCartMessage({ type: 'danger', text: "Sản phẩm này đã hết hàng."});
        return;
    }

    addItem(product, quantity, selectedSize, selectedColor);
    setAddToCartMessage({ type: 'success', text: `${quantity} x ${product.product_name} đã được thêm vào giỏ!` });
    // Tự động ẩn thông báo sau vài giây
    setTimeout(() => setAddToCartMessage({ type: '', text: '' }), 4000);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => {
        const newQty = prev + change;
        if (newQty < 1) return 1;
        // if (newQty > currentVariantStock && currentVariantStock > 0) { // Chỉ check nếu biết stock
        //     setAddToCartMessage({type: 'warning', text: `Chỉ còn ${currentVariantStock} sản phẩm.`});
        //     return currentVariantStock;
        // }
        return newQty;
    });
  };

   const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
    setMainImage(PLACEHOLDER_PRODUCT_IMAGE);
  };

  // Chuẩn bị ảnh cho carousel (nếu dùng)
  const carouselImages = useMemo(() => {
    if (!product) return [];
    const images = [];
    if (product.imageUrl) images.push({ src: product.imageUrl, alt: product.product_name });
    if (product.secondaryImageUrl) images.push({ src: product.secondaryImageUrl, alt: `${product.product_name} - view 2` });
    // Thêm các ảnh khác từ một mảng product.galleryImages nếu có
    return images.length > 0 ? images : [{src: null, alt: product.product_name}]; // Fallback với placeholder nếu không có ảnh nào
  }, [product]);


  if (loading) return <Container className="my-5"><LoadingSpinner message="Đang tải sản phẩm..." /></Container>;
  if (error) return <Container className="my-5"><AlertMessage variant="danger">Lỗi: Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.</AlertMessage></Container>;
  if (!product) return <Container className="my-5"><AlertMessage variant="warning">Sản phẩm không tồn tại hoặc đã bị xóa.</AlertMessage></Container>;

  return (
    <Container className="my-4 my-md-5 product-detail-page">
      <Breadcrumb listProps={{ className: "breadcrumb-style mb-3" }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/collections" }}>Sản phẩm</Breadcrumb.Item>
        {product.category && (
          <Breadcrumb.Item
            linkAs={Link}
            linkProps={{ to: `/collections/${product.category.category_name.toLowerCase().replace(/\s+/g, '-')}` }} // Giả lập slug
          >
            {product.category.category_name}
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item active>{product.product_name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4 g-lg-5">
        <Col md={6} lg={7} className="product-images-col">
          {/* Sử dụng ImageCarousel nếu có nhiều ảnh, ngược lại dùng Image thường */}
          {carouselImages.length > 1 ? (
            <ImageCarousel images={carouselImages} slideHeight="auto" objectFit="contain" className="product-detail-carousel shadow-sm rounded"/>
          ) : (
            <Image
              src={mainImage}
              alt={product.product_name}
              fluid
              className="product-main-image shadow-sm rounded"
              onError={handleImageError}
            />
          )}
          {/* TODO: Thumbnails nếu có nhiều ảnh và không dùng carousel */}
        </Col>

        <Col md={6} lg={5} className="product-info-col">
          {product.isNewArrival && !isCompletelyOutOfStock && <Badge bg="danger" className="mb-2 product-badge">NEW</Badge>}
          {isCompletelyOutOfStock && <Badge bg="dark" className="mb-2 product-badge">SOLD OUT</Badge>}

          <h1 className="product-title mb-2">{product.product_name}</h1>
          <p className="product-price h3 mb-3">{formatCurrency(product.product_price)}</p>

          {/* Hiển thị category */}
          {product.category && (
            <p className="text-muted small product-category-info">
                Danh mục: <Link to={`/collections/${product.category.category_name.toLowerCase().replace(/\s+/g, '-')}`} className="text-decoration-none">{product.category.category_name}</Link>
            </p>
          )}
          <hr className="my-3" />

          {/* Lựa chọn Size */}
          {availableSizes.length > 0 && (
            <div className="mb-3">
              <SizeSelector
                sizes={availableSizes}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                inventory={inventoryData}
                selectedColor={selectedColor}
                disabled={isCompletelyOutOfStock}
              />
            </div>
          )}

          {/* Lựa chọn Màu */}
          {availableColors.length > 0 && (
            <div className="mb-3">
              <ColorSelector
                colors={availableColors}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                inventory={inventoryData}
                selectedSize={selectedSize}
                disabled={isCompletelyOutOfStock}
              />
            </div>
          )}

          {/* Lựa chọn Số Lượng */}
          {!isCompletelyOutOfStock && (
            <div className="mb-3 d-flex align-items-center quantity-selector">
              <span className="me-3 qty-label">Số lượng:</span>
              <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Decrease quantity">-</Button>
              <Form.Control
                type="text" // Dùng text để cho phép nhập, nhưng sẽ validate
                value={quantity}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) setQuantity(val);
                    else if (e.target.value === "") setQuantity(""); // Cho phép xóa để nhập số mới
                }}
                onBlur={(e) => {
                    if (e.target.value === "" || parseInt(e.target.value, 10) < 1) setQuantity(1);
                }}
                className="mx-2 text-center quantity-input"
                style={{ width: '50px' }}
                aria-label="Product quantity"
              />
              <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= currentVariantStock && currentVariantStock > 0} aria-label="Increase quantity">+</Button>
              {currentVariantStock > 0 && currentVariantStock <= 5 && !isCompletelyOutOfStock && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0) && (
                <small className="text-danger ms-2">(Chỉ còn {currentVariantStock} sản phẩm)</small>
              )}
            </div>
          )}

          {/* Thông báo */}
          {addToCartMessage.text && (
            <Alert variant={addToCartMessage.type} className="mt-3 py-2 small text-start">
              {addToCartMessage.text}
              {addToCartMessage.type === 'success' && <Link to="/cart" className="ms-2 fw-bold">Xem giỏ hàng</Link>}
            </Alert>
          )}


          {/* Nút Add to Cart / Sold Out */}
          <div className="d-grid gap-2 mt-3">
            <Button
              variant="dark"
              size="lg"
              onClick={handleAddToCart}
              disabled={isCompletelyOutOfStock || (currentVariantStock === 0 && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0))}
              className="add-to-cart-main-btn"
            >
              <i className="bi bi-cart-plus-fill me-2"></i>
              {isCompletelyOutOfStock ? "Hết hàng" : (currentVariantStock === 0 && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0) ? "Lựa chọn này đã hết" : "Thêm vào giỏ")}
            </Button>
          </div>

          {/* Mô tả Sản Phẩm */}
          {product.product_description && (
            <div className="mt-4 product-description">
              <h5 className="section-sub-title">Mô tả sản phẩm</h5>
              {/* Dùng dangerouslySetInnerHTML nếu mô tả là HTML, nhưng CẨN THẬN XSS */}
              {/* Hoặc dùng một thư viện để parse và sanitize HTML (ví dụ: DOMPurify) */}
              <p className="text-secondary lh-lg">{product.product_description.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
            </div>
          )}

          {/* Thông tin thêm: SKU, Collections */}
            <div className="mt-3 product-meta small text-muted">
                {product.inventory?.find(inv => inv.size_id === (selectedSize?.size_id || null) && inv.color_id === (selectedColor?.color_id || null))?.sku && (
                     <p className="mb-1">SKU: {product.inventory.find(inv => inv.size_id === (selectedSize?.size_id || null) && inv.color_id === (selectedColor?.color_id || null)).sku}</p>
                )}
                {product.collections && product.collections.length > 0 && (
                    <p className="mb-0">Bộ sưu tập: {product.collections.map(col => <Link key={col.collection_id} to={`/collections/${col.slug || col.collection_id}`} className="text-muted me-1">{col.collection_name}</Link>)}</p>
                )}
            </div>


        </Col>
      </Row>

      {/* TODO: Phần Related Products/You Might Also Like */}
      {/* <Row className="mt-5 related-products-section">
        <Col>
          <h3 className="text-center section-title mb-4">You Might Also Like</h3>
          <ProductGrid products={relatedProducts_placeholder} itemsPerRow={{xs:1, sm:2, md:4, lg:4}} />
        </Col>
      </Row> */}
    </Container>
  );
}

export default ProductDetailPage;