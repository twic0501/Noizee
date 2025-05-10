// src/components/cart/CartSummary.jsx
import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '@noizee/shared-utils  ';

function CartSummary({ showCheckoutButton = true }) {
  const { totalPrice, totalItems } = useCart();

  // TODO: Thêm logic tính phí ship, thuế, discount nếu cần

  return (
    <Card className="shadow-sm"> {/* CSS */}
      <Card.Body>
        <Card.Title className="mb-3 cart-summary-title">Order Summary</Card.Title> {/* CSS */}
        <ListGroup variant="flush">
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Subtotal ({totalItems} items)</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Shipping</span>
            <span>Free</span> {/* TODO: Tính phí ship */}
          </ListGroup.Item>
          {/* <ListGroup.Item className="d-flex justify-content-between">
            <span>Discount</span>
            <strong className="text-danger">-{formatCurrency(0)}</strong> {}
          </ListGroup.Item> */}
          <ListGroup.Item className="d-flex justify-content-between fw-bold h5">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span> {/* TODO: Cộng ship, trừ discount */}
          </ListGroup.Item>
        </ListGroup>
        {showCheckoutButton && (
          <div className="d-grid mt-3">
            <Button
                as={Link}
                to="/checkout"
                variant="dark" /* CSS: Style nút */
                size="lg"
                disabled={totalItems === 0} // Disable nếu giỏ hàng trống
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default CartSummary;