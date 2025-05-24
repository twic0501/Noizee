// src/pages/CartPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { useCart } from '../hooks/useCart';
import CartItem from '../components/cart/CartItem'; // Đã dịch
import CartSummary from '../components/cart/CartSummary'; // Đã dịch
import AlertMessage from '../components/common/AlertMessage';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './CartPage.css';

function CartPage() {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { cartItems, clearCart, totalItems } = useCart();
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';

  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  return (
    <Container className="my-4 my-md-5 cart-page">
      <div className="text-center mb-4">
        <h1 className="page-main-title">{t('cartPage.title')}</h1>
        {totalItems > 0 && <p className="text-muted">{t('cartPage.itemsCount', { count: totalItems })}</p>}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center empty-cart-message">
          <i className="bi bi-cart-x-fill empty-cart-icon"></i>
          <p className="lead mt-3">{t('cartPage.emptyMessage')}</p>
          <Button as={Link} to={langLink("/collections")} variant="dark" size="lg" className="mt-3 start-shopping-btn">
            <i className="bi bi-arrow-left me-2"></i> {t('cartPage.continueShoppingButton')}
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          <Col lg={8} className="mb-4 mb-lg-0">
            <Card className="shadow-sm cart-items-card">
              <Card.Header className="d-flex justify-content-between align-items-center cart-items-header">
                <h5 className="mb-0">{t('cartPage.cartItemsHeader', { count: totalItems })}</h5>
                <Button variant="outline-danger" size="sm" onClick={clearCart} className="clear-cart-btn" disabled={cartItems.length === 0}>
                  <i className="bi bi-trash3 me-1"></i> {t('cartPage.clearAllButton')}
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="cart-items-list">
                    {cartItems.map(item => (
                        <CartItem key={item.cartItemId} item={item} />
                    ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <div className="cart-summary-sticky">
                <CartSummary showCheckoutButton={true} /> {/* CartSummary đã được dịch */}
                <div className="text-center mt-3 continue-shopping-link-bottom">
                    <Link to={langLink("/collections")} className="text-muted text-decoration-none">
                        <i className="bi bi-arrow-left me-1"></i> {t('cartPage.orContinueShoppingLink')}
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
