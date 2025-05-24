// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Image, Button, Badge, Breadcrumb, Form, Alert } from 'react-bootstrap';
import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/queries/productQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import SizeSelector from '../components/product/SizeSelector';
import ColorSelector from '../components/product/ColorSelector';
import ImageCarousel from '../components/product/ImageCarousel';
import { useCart } from '../hooks/useCart';
import { formatCurrency, getFullImageUrl, formatDate, formatDateTime } from '../utils/formatters'; // Thêm formatDate, formatDateTime
import { PLACEHOLDER_PRODUCT_IMAGE, DEFAULT_USER_LANGUAGE } from '../utils/constants'; // Thêm DEFAULT_USER_LANGUAGE
import { useTranslation } from 'react-i18next';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id: productIdFromUrl } = useParams(); // id or slug from URL
  // const navigate = useNavigate(); // Bỏ nếu không dùng trực tiếp
  const { addItem } = useCart();
  const params = useParams();
  const currentLang = params.lang || i18n.language || DEFAULT_USER_LANGUAGE;

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addToCartMessage, setAddToCartMessage] = useState({ type: '', text: '' });
  const [mainImage, setMainImage] = useState('');

  const { loading, error, data } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
    variables: { id: productIdFromUrl, lang: currentLang },
    fetchPolicy: 'cache-and-network',
    onCompleted: (queryData) => {
        const productData = queryData?.product;
        if (productData) {
            const primaryImgData = productData.images?.find(img => img.display_order === 0 && !img.color_id) || productData.images?.[0];
            setMainImage(getFullImageUrl(primaryImgData?.image_url || PLACEHOLDER_PRODUCT_IMAGE));
        } else {
            setMainImage(PLACEHOLDER_PRODUCT_IMAGE);
        }
    },
    onError: (err) => {
        console.error("Error fetching product details:", err.message);
    }
  });

  const product = data?.product;

  // Sử dụng resolver ảo 'name' và 'description' từ GraphQL nếu có, đã bao gồm logic ngôn ngữ
  const productName = product?.name || t('productDetailPage.defaultProductName', 'Product Details');
  const productDescription = product?.description || '';
  const categoryName = product?.category?.name || '';
  const categorySlug = product?.category?.slug || product?.category?.category_id;

  const inventoryData = useMemo(() => product?.inventory || [], [product?.inventory]);
  const availableSizes = useMemo(() => product?.allAvailableSizes || product?.sizes || [], [product?.allAvailableSizes, product?.sizes]); // Ưu tiên allAvailableSizes
  const availableColors = useMemo(() => product?.allAvailableColors || product?.colors || [], [product?.allAvailableColors, product?.colors]); // Ưu tiên allAvailableColors


  const getVariantStock = useCallback((sizeId, colorId) => {
    if (!inventoryData || inventoryData.length === 0) {
        return (availableSizes.length > 0 || availableColors.length > 0) ? 0 : Infinity;
    }
    const variant = inventoryData.find(inv =>
      inv.size_id === (sizeId || null) &&
      inv.color_id === (colorId || null)
    );
    return variant ? variant.quantity : 0;
  }, [inventoryData, availableSizes, availableColors]);

  const currentVariantStock = useMemo(() => {
    if (!product) return 0;
    if (availableSizes.length === 0 && availableColors.length === 0) {
        const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
        return simpleInventory ? simpleInventory.quantity : (inventoryData.length === 0 ? Infinity : 0);
    }
    if ((availableSizes.length > 0 && !selectedSize) || (availableColors.length > 0 && !selectedColor)) {
        return 0;
    }
    return getVariantStock(selectedSize?.size_id, selectedColor?.color_id);
  }, [product, selectedSize, selectedColor, inventoryData, availableSizes, availableColors, getVariantStock]);

  const isCompletelyOutOfStock = useMemo(() => {
      if (!inventoryData || !product) return true;
      if (inventoryData.length === 0 && (availableSizes.length > 0 || availableColors.length > 0)) return true;
      if (inventoryData.length === 0 && availableSizes.length === 0 && availableColors.length === 0) return false;
      return inventoryData.every(inv => inv.quantity <= 0);
  }, [inventoryData, product, availableSizes, availableColors]);

  useEffect(() => {
    setAddToCartMessage({ type: '', text: '' });
  }, [selectedSize, selectedColor, quantity]);

  const handleSelectColor = useCallback((color) => {
    const newSelectedColor = color?.color_id === selectedColor?.color_id ? null : color;
    setSelectedColor(newSelectedColor);
    setAddToCartMessage({ type: '', text: '' });
    if (newSelectedColor && product?.images) {
        const colorSpecificImage = product.images.find(img => img.color_id === newSelectedColor.color_id && img.display_order === 0);
        if (colorSpecificImage) {
            setMainImage(getFullImageUrl(colorSpecificImage.image_url));
        } else {
            const primaryImgData = product.images?.find(img => img.display_order === 0 && !img.color_id) || product.images?.[0];
            setMainImage(getFullImageUrl(primaryImgData?.image_url || PLACEHOLDER_PRODUCT_IMAGE));
        }
    } else {
        const primaryImgData = product?.images?.find(img => img.display_order === 0 && !img.color_id) || product?.images?.[0];
        setMainImage(getFullImageUrl(primaryImgData?.image_url || PLACEHOLDER_PRODUCT_IMAGE));
    }
  }, [selectedColor, product?.images, product?.imageUrl]); // Sửa product?.imageUrl thành product?.images

  const handleAddToCart = () => {
    setAddToCartMessage({ type: '', text: '' });
    if (availableSizes.length > 0 && !selectedSize) {
      setAddToCartMessage({ type: 'danger', text: t('productDetailPage.validation.selectSize') });
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      setAddToCartMessage({ type: 'danger', text: t('productDetailPage.validation.selectColor') });
      return;
    }
    if (currentVariantStock < quantity) {
      setAddToCartMessage({ type: 'danger', text: t('productDetailPage.validation.notEnoughStock', { count: currentVariantStock }) });
      return;
    }
    if (currentVariantStock === 0 && !isCompletelyOutOfStock) {
        setAddToCartMessage({ type: 'danger', text: t('productDetailPage.validation.variantOutOfStock')});
        return;
    }
    if (isCompletelyOutOfStock) {
        setAddToCartMessage({ type: 'danger', text: t('productDetailPage.validation.productOutOfStock')});
        return;
    }

    addItem(product, quantity, selectedSize, selectedColor);
    setAddToCartMessage({ type: 'success', text: t('productDetailPage.addedToCartSuccess', { quantity, productName }) });
    setTimeout(() => setAddToCartMessage({ type: '', text: '' }), 4000);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => {
        const newQty = prev + change;
        if (newQty < 1) return 1;
        return newQty;
    });
  };

   const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
    setMainImage(PLACEHOLDER_PRODUCT_IMAGE);
  };

  const carouselImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) {
        // Nếu không có mảng images, thử dùng mainImage (đã được set từ product.imageUrl)
        return [{ src: mainImage || PLACEHOLDER_PRODUCT_IMAGE, alt: productName }];
    }
    return product.images.map(img => ({
        src: img.image_url,
        // Sử dụng alt_text từ resolver ảo của ProductImage nếu có, hoặc fallback
        alt: img.alt_text || productName,
    }));
  }, [product, productName, mainImage]);

  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  if (loading) return <Container className="my-5"><LoadingSpinner message={t('loadingSpinner.loading')} /></Container>;
  if (error) return <Container className="my-5"><AlertMessage variant="danger">{t('productDetailPage.loadError', { message: error.message })}</AlertMessage></Container>;
  if (!product) return <Container className="my-5"><AlertMessage variant="warning">{t('productDetailPage.notFoundError')}</AlertMessage></Container>;

  return (
    <Container className="my-4 my-md-5 product-detail-page">
      <Breadcrumb listProps={{ className: "breadcrumb-style mb-3" }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: langLink("/") }}>{t('breadcrumb.home')}</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: langLink("/collections") }}>{t('breadcrumb.products')}</Breadcrumb.Item>
        {product.category && categoryName && (
          <Breadcrumb.Item
            linkAs={Link}
            linkProps={{ to: langLink(`/collections/${categorySlug}`) }} // Sử dụng categorySlug
          >
            {categoryName}
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item active>{productName}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4 g-lg-5">
        <Col md={6} lg={7} className="product-images-col">
          {carouselImages.length > 0 ? (
            <ImageCarousel images={carouselImages} slideHeight="auto" objectFit="contain" className="product-detail-carousel shadow-sm rounded"/>
          ) : (
            <Image // Fallback nếu carouselImages rỗng (ít khi xảy ra)
              src={mainImage}
              alt={productName}
              fluid
              className="product-main-image shadow-sm rounded"
              onError={handleImageError}
            />
          )}
        </Col>

        <Col md={6} lg={5} className="product-info-col">
          {product.is_new_arrival && !isCompletelyOutOfStock && <Badge bg="danger" className="mb-2 product-badge">{t('productCard.new')}</Badge>}
          {isCompletelyOutOfStock && <Badge bg="dark" className="mb-2 product-badge">{t('productCard.outOfStock')}</Badge>}

          <h1 className="product-title mb-2">{productName}</h1>
          <p className="product-price h3 mb-3">{formatCurrency(product.product_price, i18n.language)}</p>

          {product.category && categoryName && (
            <p className="text-muted small product-category-info">
                {t('productDetailPage.categoryLabel')}: <Link to={langLink(`/collections/${categorySlug}`)} className="text-decoration-none">{categoryName}</Link>
            </p>
          )}
          <hr className="my-3" />

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

          {availableColors.length > 0 && (
            <div className="mb-3">
              <ColorSelector
                colors={availableColors}
                selectedColor={selectedColor}
                onSelectColor={handleSelectColor}
                inventory={inventoryData}
                selectedSize={selectedSize}
                disabled={isCompletelyOutOfStock}
              />
            </div>
          )}

          {!isCompletelyOutOfStock && (
            <div className="mb-3 d-flex align-items-center quantity-selector">
              <span className="me-3 qty-label">{t('productDetailPage.quantityLabel')}:</span>
              <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label={t('productDetailPage.decreaseQuantityAriaLabel')}>-</Button>
              <Form.Control
                type="text"
                value={quantity}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) setQuantity(val);
                    else if (e.target.value === "") setQuantity("");
                }}
                onBlur={(e) => {
                    if (e.target.value === "" || parseInt(e.target.value, 10) < 1) setQuantity(1);
                }}
                className="mx-2 text-center quantity-input"
                style={{ width: '50px' }}
                aria-label={t('productDetailPage.quantityInputAriaLabel')}
              />
              <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= currentVariantStock && currentVariantStock > 0} aria-label={t('productDetailPage.increaseQuantityAriaLabel')}>+</Button>
              {currentVariantStock > 0 && currentVariantStock <= 5 && !isCompletelyOutOfStock && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0) && (
                <small className="text-danger ms-2">{t('productDetailPage.lowStockWarning', { count: currentVariantStock })}</small>
              )}
            </div>
          )}

          {addToCartMessage.text && (
            <Alert variant={addToCartMessage.type} className="mt-3 py-2 small text-start" dismissible onClose={() => setAddToCartMessage({type: '', text: ''})}>
              {addToCartMessage.text}
              {addToCartMessage.type === 'success' && <Link to={langLink("/cart")} className="ms-2 fw-bold">{t('productDetailPage.viewCartLink')}</Link>}
            </Alert>
          )}

          <div className="d-grid gap-2 mt-3">
            <Button
              variant="dark"
              size="lg"
              onClick={handleAddToCart}
              disabled={isCompletelyOutOfStock || (currentVariantStock === 0 && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0))}
              className="add-to-cart-main-btn"
            >
              <i className="bi bi-cart-plus-fill me-2"></i>
              {isCompletelyOutOfStock ? t('productCard.outOfStock') : (currentVariantStock === 0 && ((availableSizes.length > 0 && selectedSize) || availableSizes.length === 0) && ((availableColors.length > 0 && selectedColor) || availableColors.length === 0) ? t('productDetailPage.variantSoldOut') : t('productCard.addToCart'))}
            </Button>
          </div>

          {productDescription && (
            <div className="mt-4 product-description">
              <h5 className="section-sub-title">{t('productDetailPage.descriptionTitle')}</h5>
              <div className="text-secondary lh-lg" dangerouslySetInnerHTML={{ __html: productDescription.replace(/\n/g, '<br />') }} />
            </div>
          )}

            <div className="mt-3 product-meta small text-muted">
                {product.inventory?.find(inv => inv.size_id === (selectedSize?.size_id || null) && inv.color_id === (selectedColor?.color_id || null))?.sku && (
                     <p className="mb-1">{t('productDetailPage.skuLabel')}: {product.inventory.find(inv => inv.size_id === (selectedSize?.size_id || null) && inv.color_id === (selectedColor?.color_id || null)).sku}</p>
                )}
                {product.collections && product.collections.length > 0 && (
                    <p className="mb-0">{t('productDetailPage.collectionsLabel')}: {product.collections.map(col => {
                        // Giả sử col.name đã được dịch từ resolver
                        return <Link key={col.collection_id} to={langLink(`/collections/${col.slug || col.collection_id}`)} className="text-muted me-1">{col.name}</Link>
                    })}</p>
                )}
            </div>
        </Col>
      </Row>
      {/* Related Products Section (TODO) */}
    </Container>
  );
}

export default ProductDetailPage;
