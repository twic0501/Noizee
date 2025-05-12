// src/components/cart/CartItem.jsx
import React from 'react';
import { Row, Col, Image, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants'; // Import placeholder

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  if (!item || !item.cartItemId) return null; // Guard clause

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      // TODO: Check against available stock for this specific variant if possible
      updateQuantity(item.cartItemId, newQuantity);
    } else if (e.target.value === '') {
      // Allow temporary empty input, will be validated onBlur
    } else {
      // Revert to 1 if input is invalid but not empty
      updateQuantity(item.cartItemId, 1);
    }
  };

  const handleQuantityBlur = (e) => {
    const currentQuantity = parseInt(e.target.value, 10);
    if (isNaN(currentQuantity) || currentQuantity < 1) {
      updateQuantity(item.cartItemId, 1); // Set to 1 if left empty or invalid
    }
    // Additional stock check can be done here if needed
  };

  const handleRemove = () => {
    removeItem(item.cartItemId);
  };

  const handleImageError = (e) => {
    e.target.onerror = null; // prevent infinite loop if placeholder also fails
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
  };

  const itemSubtotal = item.price * item.quantity;
  const imageUrl = getFullImageUrl(item.imageUrl); // Use helper

  return (
    <Row className="cart-item align-items-center py-3 border-bottom mx-0">
      {/* Product Image and Name/Variant */}
      <Col xs={12} md={5} lg={6} className="d-flex align-items-center mb-2 mb-md-0 ps-md-0">
        <Image
          src={imageUrl}
          alt={item.name}
          className="cart-item-image me-3" // CSS for fixed size
          onError={handleImageError}
        />
        <div>
          <Link to={`/products/${item.productId}`} className="fw-bold text-dark text-decoration-none cart-item-name">
            {item.name}
          </Link>
          <div className="text-muted small mt-1 cart-item-variants">
            {item.size && <span>Size: {item.size.size_name}</span>}
            {item.size && item.color && <span className="mx-1">|</span>}
            {item.color && <span>Color: {item.color.color_name}</span>}
            {(!item.size && !item.color) && <span>&nbsp;</span>} {/* Keep layout consistent */}
          </div>
        </div>
      </Col>

      {/* Price */}
      <Col xs={4} sm={3} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted me-1">Giá:</span>
        {formatCurrency(item.price)}
      </Col>

      {/* Quantity */}
      <Col xs={4} sm={3} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted me-1">SL:</span>
        <Form.Control
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          onBlur={handleQuantityBlur}
          className="cart-item-qty-input" // CSS for small width
          size="sm"
          aria-label={`Quantity for ${item.name}`}
        />
      </Col>

      {/* Subtotal */}
      <Col xs={3} sm={4} md={1} className="text-end fw-bold cart-item-details">
        <span className="d-md-none small text-muted me-1">Tổng:</span>
        {formatCurrency(itemSubtotal)}
      </Col>

      {/* Remove Button */}
      <Col xs={1} md={1} className="text-end pe-md-0 cart-item-details">
        <Button variant="link" className="text-danger p-0 cart-item-remove-btn" onClick={handleRemove} title="Remove Item">
          <i className="bi bi-trash-fill"></i>
        </Button>
      </Col>
    </Row>
  );
}

export default CartItem;