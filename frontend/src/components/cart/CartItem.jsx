// src/components/cart/CartItem.jsx
import React from 'react';
import { Row, Col, Image, Button, Form } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

// import './CartItem.css'; // Đã có trong file user upload

function CartItem({ item }) {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { updateQuantity, removeItem } = useCart();
  const params = useParams(); // Để lấy lang từ URL cho link sản phẩm
  const currentLang = params.lang || i18n.language || 'vi';

  if (!item || !item.cartItemId) return null;

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      updateQuantity(item.cartItemId, newQuantity);
    } else if (e.target.value === '') {
      // Allow temporary empty input
    } else {
      updateQuantity(item.cartItemId, 1);
    }
  };

  const handleQuantityBlur = (e) => {
    const currentQuantity = parseInt(e.target.value, 10);
    if (isNaN(currentQuantity) || currentQuantity < 1) {
      updateQuantity(item.cartItemId, 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.cartItemId);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
  };

  const itemSubtotal = item.price * item.quantity;
  // Sử dụng tên sản phẩm đã được dịch (giả sử item.name đã là tên theo ngôn ngữ hiện tại từ CartContext)
  // Nếu CartContext lưu trữ name_vi, name_en thì cần logic chọn ở đây tương tự ProductCard
  const productName = item.name; // Giả định item.name đã được xử lý ngôn ngữ
  const imageUrl = getFullImageUrl(item.imageUrl);

  // Lấy tên size và color đã được dịch nếu chúng là object chứa các trường ngôn ngữ
  // Hoặc nếu chúng chỉ là string thì hiển thị trực tiếp
  const sizeName = item.size?.size_name; // Giả sử size_name không cần dịch thêm ở đây
  const colorName = item.color?.color_name; // Giả sử color_name không cần dịch thêm ở đây

  return (
    <Row className="cart-item align-items-center py-3 border-bottom mx-0">
      <Col xs={12} md={5} lg={6} className="d-flex align-items-center mb-2 mb-md-0 ps-md-0">
        <Image
          src={imageUrl}
          alt={productName}
          className="cart-item-image me-3"
          onError={handleImageError}
        />
        <div>
          <Link to={`/${currentLang}/products/${item.productId}`} className="fw-bold text-dark text-decoration-none cart-item-name">
            {productName}
          </Link>
          <div className="text-muted small mt-1 cart-item-variants">
            {sizeName && <span>{t('cartItem.sizeLabel')} {sizeName}</span>}
            {sizeName && colorName && <span className="mx-1">|</span>}
            {colorName && <span>{t('cartItem.colorLabel')} {colorName}</span>}
            {(!sizeName && !colorName) && <span>&nbsp;</span>}
          </div>
        </div>
      </Col>

      <Col xs={4} sm={3} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted me-1">{t('cartItem.priceLabel')}</span>
        {formatCurrency(item.price, i18n.language)}
      </Col>

      <Col xs={4} sm={3} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted me-1">{t('cartItem.quantityLabel')}</span>
        <Form.Control
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          onBlur={handleQuantityBlur}
          className="cart-item-qty-input"
          size="sm"
          aria-label={t('cartItem.quantityAriaLabel', { productName: productName })}
        />
      </Col>

      <Col xs={3} sm={4} md={1} className="text-end fw-bold cart-item-details">
        <span className="d-md-none small text-muted me-1">{t('cartItem.totalLabel')}</span>
        {formatCurrency(itemSubtotal, i18n.language)}
      </Col>

      <Col xs={1} md={1} className="text-end pe-md-0 cart-item-details">
        <Button variant="link" className="text-danger p-0 cart-item-remove-btn" onClick={handleRemove} title={t('cartItem.removeTitle')}>
          <i className="bi bi-trash-fill"></i>
        </Button>
      </Col>
    </Row>
  );
}

export default CartItem;
