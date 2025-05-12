// src/pages/CartPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import AlertMessage from '../components/common/AlertMessage';
import './CartPage.css'; // Tạo file CSS riêng

function CartPage() {
  const { cartItems, clearCart, totalItems } = useCart(); // Lấy thêm totalItems

  return (
    <Container className="my-4 my-md-5 cart-page">
      <div className="text-center mb-4">
        <h1 className="page-main-title">Giỏ hàng của bạn</h1> {/* CSS */}
        {totalItems > 0 && <p className="text-muted">Bạn đang có {totalItems} sản phẩm trong giỏ hàng.</p>}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center empty-cart-message"> {/* CSS */}
          <i className="bi bi-cart-x-fill empty-cart-icon"></i> {/* CSS */}
          <p className="lead mt-3">Giỏ hàng của bạn hiện đang trống.</p>
          <Button as={Link} to="/collections" variant="dark" size="lg" className="mt-3 start-shopping-btn"> {/* CSS */}
            <i className="bi bi-arrow-left me-2"></i> Tiếp tục mua sắm
          </Button>
        </div>
      ) : (
        <Row className="g-4"> {/* Thêm g-4 để có khoảng cách */}
          {/* Cột danh sách item */}
          <Col lg={8} className="mb-4 mb-lg-0">
            <Card className="shadow-sm cart-items-card"> {/* CSS */}
              <Card.Header className="d-flex justify-content-between align-items-center cart-items-header">
                <h5 className="mb-0">Sản phẩm trong giỏ ({totalItems})</h5>
                <Button variant="outline-danger" size="sm" onClick={clearCart} className="clear-cart-btn" disabled={cartItems.length === 0}>
                  <i className="bi bi-trash3 me-1"></i> Xóa tất cả
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                {/* Nên có một div bọc các CartItem để có thể scroll nếu quá nhiều */}
                <div className="cart-items-list"> {/* CSS: max-height, overflow-y: auto */}
                    {cartItems.map(item => (
                        <CartItem key={item.cartItemId} item={item} />
                    ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Cột tóm tắt đơn hàng */}
          <Col lg={4}>
            <div className="cart-summary-sticky"> {/* CSS: position sticky */}
                <CartSummary showCheckoutButton={true} />
                <div className="text-center mt-3 continue-shopping-link-bottom">
                    <Link to="/collections" className="text-muted text-decoration-none">
                        <i className="bi bi-arrow-left me-1"></i> Hoặc tiếp tục lựa chọn sản phẩm
                    </Link>
                </div>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default CartPage;