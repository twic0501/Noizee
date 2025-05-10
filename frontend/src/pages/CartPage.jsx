// src/pages/CartPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import AlertMessage from '@noizee/ui-components';

function CartPage() {
  const { cartItems, clearCart } = useCart();

  return (
    <Container className="my-4 my-md-5">
      <h1 className="mb-4 page-title">Shopping Cart</h1> {/* CSS */}

      {cartItems.length === 0 ? (
        <AlertMessage variant="info">
          Your cart is currently empty. <Link to="/collections">Continue Shopping</Link>
        </AlertMessage>
      ) : (
        <Row>
          {/* Cột danh sách item */}
          <Col lg={8} className="mb-4 mb-lg-0">
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Cart Items ({cartItems.length})</h5>
                <Button variant="outline-danger" size="sm" onClick={clearCart}>
                   Clear Cart
                </Button>
              </Card.Header>
              <Card.Body className="p-0"> {/* Bỏ padding để Row CartItem chiếm đủ */}
                {cartItems.map(item => (
                  <CartItem key={item.cartItemId} item={item} />
                ))}
              </Card.Body>
            </Card>
          </Col>

          {/* Cột tóm tắt đơn hàng */}
          <Col lg={4}>
            <CartSummary showCheckoutButton={true} />
            <div className="text-center mt-3">
                <Link to="/collections" className="text-muted text-decoration-none">
                   <i className="bi bi-arrow-left me-1"></i> Continue Shopping
                </Link>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default CartPage;