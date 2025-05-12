// src/components/cart/CartSummary.jsx
import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth'; // Để lấy virtual_balance
import { formatCurrency } from '../../utils/formatters';

// Giả sử bạn có file CSS riêng cho CartSummary
// import './CartSummary.css';

function CartSummary({ showCheckoutButton = true, isCheckoutPage = false }) {
  const { totalPrice, totalItems } = useCart();
  const { userInfo } = useAuth();

  // --- Logic tính toán chiết khấu ---
  const shippingFee = 0; // Tạm thời miễn phí vận chuyển
  let discountAmount = 0;
  let finalPrice = totalPrice + shippingFee;
  let discountNote = null;

  if (userInfo?.virtual_balance > 0 && totalPrice > 0 && isCheckoutPage) {
    // Áp dụng tối đa 10% tổng giá trị đơn hàng hoặc toàn bộ số dư ảo nếu ít hơn
    const tenPercentOfTotal = totalPrice * 0.10;
    discountAmount = Math.min(tenPercentOfTotal, userInfo.virtual_balance);
    discountAmount = Math.floor(discountAmount / 1000) * 1000; // Làm tròn xuống hàng nghìn
    finalPrice = totalPrice + shippingFee - discountAmount;
    discountNote = `(Đã áp dụng ${formatCurrency(discountAmount)} từ số dư ${formatCurrency(userInfo.virtual_balance)})`;
  }
  // ------------------------------------

  return (
    <Card className="shadow-sm cart-summary-card"> {/* CSS class */}
      <Card.Body>
        <Card.Title className="mb-3 cart-summary-title">Tóm tắt đơn hàng</Card.Title> {/* CSS class */}
        <ListGroup variant="flush" className="cart-summary-list">
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Tạm tính ({totalItems} sản phẩm)</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Phí vận chuyển</span>
            <span>{shippingFee > 0 ? formatCurrency(shippingFee) : 'Miễn phí'}</span>
          </ListGroup.Item>
          {isCheckoutPage && discountAmount > 0 && (
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Giảm giá từ số dư</span>
              <strong className="text-success">-{formatCurrency(discountAmount)}</strong>
            </ListGroup.Item>
          )}
          <ListGroup.Item className="d-flex justify-content-between fw-bold h5 total-price-row">
            <span>Tổng cộng</span>
            <span>{formatCurrency(finalPrice)}</span>
          </ListGroup.Item>
          {isCheckoutPage && discountNote && (
            <ListGroup.Item className="text-muted small pt-1 px-0 border-0">
              {discountNote}
            </ListGroup.Item>
          )}
        </ListGroup>

        {showCheckoutButton && (
          <div className="d-grid mt-3">
            <Button
              as={Link}
              to="/checkout"
              variant="dark" // Hoặc màu primary của bạn
              size="lg"
              className="checkout-button" // CSS class
              disabled={totalItems === 0}
            >
              Tiến hành đặt hàng
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default CartSummary;