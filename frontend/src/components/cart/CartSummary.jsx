// src/components/cart/CartSummary.jsx
import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

// import './CartSummary.css';

function CartSummary({ showCheckoutButton = true, isCheckoutPage = false }) {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { totalPrice, totalItems } = useCart();
  const { userInfo } = useAuth();
  const params = useParams(); // Để lấy lang từ URL cho link checkout
  const currentLang = params.lang || i18n.language || 'vi';

  const shippingFee = 0;
  let discountAmount = 0;
  let finalPrice = totalPrice + shippingFee;
  let discountNote = null;

  if (userInfo?.virtual_balance > 0 && totalPrice > 0 && isCheckoutPage) {
    const tenPercentOfTotal = totalPrice * 0.10;
    discountAmount = Math.min(tenPercentOfTotal, userInfo.virtual_balance);
    discountAmount = Math.floor(discountAmount / 1000) * 1000;
    finalPrice = totalPrice + shippingFee - discountAmount;
    discountNote = t('cartSummary.discountAppliedNote', {
        discount: formatCurrency(discountAmount, i18n.language), // Truyền ngôn ngữ
        balance: formatCurrency(userInfo.virtual_balance, i18n.language) // Truyền ngôn ngữ
    });
  }

  return (
    <Card className="shadow-sm cart-summary-card">
      <Card.Body>
        <Card.Title className="mb-3 cart-summary-title">{t('cartSummary.title')}</Card.Title>
        <ListGroup variant="flush" className="cart-summary-list">
          <ListGroup.Item className="d-flex justify-content-between">
            <span>{t('cartSummary.subtotalItems', { count: totalItems })}</span>
            <strong>{formatCurrency(totalPrice, i18n.language)}</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>{t('cartSummary.shippingFee')}</span>
            <span>{shippingFee > 0 ? formatCurrency(shippingFee, i18n.language) : t('cartSummary.freeShipping')}</span>
          </ListGroup.Item>
          {isCheckoutPage && discountAmount > 0 && (
            <ListGroup.Item className="d-flex justify-content-between">
              <span>{t('cartSummary.discountFromBalance')}</span>
              <strong className="text-success">-{formatCurrency(discountAmount, i18n.language)}</strong>
            </ListGroup.Item>
          )}
          <ListGroup.Item className="d-flex justify-content-between fw-bold h5 total-price-row">
            <span>{t('cartSummary.totalAmount')}</span>
            <span>{formatCurrency(finalPrice, i18n.language)}</span>
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
              to={`/${currentLang}/checkout`} // Thêm prefix ngôn ngữ
              variant="dark"
              size="lg"
              className="checkout-button"
              disabled={totalItems === 0}
            >
              {t('cartSummary.proceedToCheckout')}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default CartSummary;
