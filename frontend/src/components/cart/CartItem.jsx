import React from 'react';
import { Row, Col, Image, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatCurrency, getFullImageUrl } from '@noizee/shared-utils';
import { useCart } from '../../hooks/useCart';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      updateQuantity(item.cartItemId, newQuantity);
    } else if (e.target.value === '') {
      // Allow temporary empty input
    } else {
       updateQuantity(item.cartItemId, 1); // Revert if invalid
    }
  };

   const handleQuantityBlur = (e) => {
     const currentQuantity = parseInt(e.target.value, 10);
     if (isNaN(currentQuantity) || currentQuantity < 1) {
       updateQuantity(item.cartItemId, 1); // Set to 1 if left empty or invalid
     }
   };

  const handleRemove = () => {
    removeItem(item.cartItemId);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_IMAGE;
  };

  if (!item) return null;

  const itemSubtotal = item.price * item.quantity;
  const imageUrl = getFullImageUrl(item.imageUrl);

  return (
    <Row className="cart-item align-items-center py-3 border-bottom mx-0">
      <Col xs={12} md={6} className="d-flex align-items-center mb-2 mb-md-0 ps-md-0">
        <Image
          src={imageUrl}
          alt={item.name}
          thumbnail
          style={{ width: '75px', height: '100px', objectFit: 'cover', marginRight: '15px' }}
          onError={handleImageError}
        />
        <div>
          <Link to={`/products/${item.productId}`} className="fw-bold text-dark text-decoration-none cart-item-name">
            {item.name}
          </Link>
          <div className="text-muted small mt-1">
             {item.size && <span>Size: {item.size.size_name}</span>}
             {item.color && <span className="ms-2">Color: {item.color.color_name}</span>}
             {(!item.size && !item.color) && <span>&nbsp;</span>}
           </div>
        </div>
      </Col>

      <Col xs={4} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted">Price: </span>
        {formatCurrency(item.price)}
      </Col>

      <Col xs={4} md={2} className="text-md-center cart-item-details">
        <span className="d-md-none small text-muted">Qty: </span>
        <Form.Control
          type="number" min="1" value={item.quantity}
          onChange={handleQuantityChange} onBlur={handleQuantityBlur}
          style={{ width: '70px', display: 'inline-block', textAlign: 'center' }} size="sm"
        />
      </Col>

      <Col xs={3} md={1} className="text-end fw-bold cart-item-details">
        {formatCurrency(itemSubtotal)}
      </Col>

       <Col xs={1} md={1} className="text-end pe-md-0 cart-item-details">
        <Button variant="link" className="text-danger p-0" onClick={handleRemove} title="Remove Item">
          <i className="bi bi-trash"></i>
        </Button>
       </Col>
    </Row>
  );
}
export default CartItem;