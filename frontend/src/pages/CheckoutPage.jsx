// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Image, Spinner } from 'react-bootstrap';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, getFullImageUrl } from '../utils/formatters';
import { useMutation } from '@apollo/client';
import { CREATE_SALE_MUTATION } from '../api/graphql/mutations/cartMutations';
import AlertMessage from '../components/common/AlertMessage';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'; // Thêm useParams, useLocation
import { PLACEHOLDER_PRODUCT_IMAGE } from '../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './CheckoutPage.css';

function CheckoutPage() {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { cartItems, totalPrice, clearCart, totalItems } = useCart();
  const { userInfo, updateVirtualBalance, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation(); // Để lấy state.from cho link đăng nhập
  const currentLang = params.lang || i18n.language || 'vi';

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    email: '', // Thêm email vào state
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formError, setFormError] = useState('');
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    if (userInfo) {
      setShippingInfo(prev => ({
        ...prev,
        name: userInfo.customer_name || '',
        phone: userInfo.customer_tel || '',
        address: userInfo.customer_address || '',
        email: userInfo.customer_email || '' // Lấy email từ userInfo
      }));
    }
  }, [userInfo]);

  const availableBalance = userInfo?.virtual_balance || 0;
  const discountPercentage = 0.10;
  const maxDiscountFromBalance = Math.min(totalPrice * discountPercentage, availableBalance);
  const calculatedDiscount = Math.floor(maxDiscountFromBalance / 1000) * 1000;
  const shippingFee = 0;
  const finalPrice = totalPrice + shippingFee - calculatedDiscount;

  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  const [createSale, { loading: placingOrder }] = useMutation(CREATE_SALE_MUTATION, {
    onCompleted: (data) => {
      const createdSale = data.createSale;
      setOrderSuccess({
        message: t('checkoutPage.orderSuccess.mainMessage', { orderId: createdSale.sale_id }),
        orderId: createdSale.sale_id
      });
      setOrderError(null);
      if (createdSale.customer?.virtual_balance !== undefined) {
        updateVirtualBalance(createdSale.customer.virtual_balance);
      }
      clearCart();
    },
    onError: (error) => {
      console.error("Failed to place order:", error);
      setOrderError(error.message || t('checkoutPage.orderError.default'));
      setOrderSuccess(null);
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const validateShippingInfo = () => {
    if (!shippingInfo.name.trim() || !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
      setFormError(t('checkoutPage.validation.requiredFields'));
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(shippingInfo.phone.trim())) {
        setFormError(t('checkoutPage.validation.invalidPhone'));
        return false;
    }
    // Email validation (optional)
    if (shippingInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email.trim())) {
        setFormError(t('checkoutPage.validation.invalidEmail'));
        return false;
    }
    return true;
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setFormError('');
    setOrderError(null);

    if (!validateShippingInfo()) return;

    if (cartItems.length === 0) {
      setFormError(t('checkoutPage.validation.emptyCart'));
      return;
    }
    if (!isAuthenticated) {
        setFormError(t('checkoutPage.validation.loginRequired'));
        return;
    }

    const itemsInput = cartItems.map(item => ({
      product_id: item.productId,
      product_qty: item.quantity,
      sizeId: item.sizeId || null,
      colorId: item.colorId || null,
    }));
    
    // Truyền cả shippingInfo và paymentMethod nếu backend của bạn hỗ trợ
    const saleInput = {
        items: itemsInput,
        shippingInfo: { // Gửi thông tin giao hàng đã được chuẩn hóa
            name: shippingInfo.name.trim(),
            phone: shippingInfo.phone.trim(),
            address: shippingInfo.address.trim(),
            notes: shippingInfo.notes.trim(),
            // email: shippingInfo.email.trim(), // Backend có thể không cần email này nếu đã có từ customer_id
        },
        paymentMethod: paymentMethod,
        // discountApplied: calculatedDiscount, // Backend nên tự tính toán lại discount
    };

    createSale({ variables: { input: saleInput } }); // Giả sử mutation nhận một object 'input'
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
  };

  if (orderSuccess) {
    return (
      <Container className="my-4 my-md-5 text-center checkout-success-page">
        <Card className="shadow-sm p-4 p-md-5">
            <i className="bi bi-check-circle-fill text-success success-icon mb-3"></i>
            <h2 className="success-title">{t('checkoutPage.orderSuccess.title')}</h2>
            <p className="text-muted">{orderSuccess.message}</p>
            <p>{t('checkoutPage.orderSuccess.thankYou')}</p>
            <div className="mt-4">
                <Button as={Link} to={langLink(`/account/orders/${orderSuccess.orderId}`)} variant="dark" className="me-2 view-order-btn">
                    {t('checkoutPage.orderSuccess.viewOrderButton')}
                </Button>
                <Button as={Link} to={langLink("/collections")} variant="outline-secondary" className="continue-shopping-success-btn">
                    {t('checkoutPage.orderSuccess.continueShoppingButton')}
                </Button>
            </div>
        </Card>
      </Container>
    );
  }

  if (cartItems.length === 0 && !placingOrder) {
      return (
          <Container className="my-4 my-md-5 text-center">
              <AlertMessage variant="info">
                  {t('checkoutPage.emptyCartMessage')} <Link to={langLink("/collections")}>{t('checkoutPage.selectProductsLink')}</Link>
              </AlertMessage>
          </Container>
      )
  }

  return (
    <Container className="my-4 my-md-5 checkout-page">
      <div className="text-center mb-4">
         <h1 className="page-main-title">{t('checkoutPage.title')}</h1>
      </div>
      <Form onSubmit={handlePlaceOrder} id="checkout-form">
        <Row className="g-4">
          <Col lg={7} className="mb-4 mb-lg-0">
            <Card className="shadow-sm mb-4 checkout-card">
              <Card.Header className="checkout-card-header"><h5 className="mb-0">{t('checkoutPage.shippingInfo.title')}</h5></Card.Header>
              <Card.Body>
                {formError && <AlertMessage variant="danger" className="mb-3 text-start" dismissible onClose={() => setFormError('')}>{formError}</AlertMessage>}
                {orderError && <AlertMessage variant="danger" className="mb-3 text-start" dismissible onClose={() => setOrderError(null)}>{orderError}</AlertMessage>}

                <Form.Group className="mb-3" controlId="checkoutName">
                  <Form.Label>{t('checkoutPage.shippingInfo.nameLabel')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="name" value={shippingInfo.name} onChange={handleInputChange} required disabled={placingOrder}/>
                </Form.Group>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="checkoutPhone">
                        <Form.Label>{t('checkoutPage.shippingInfo.phoneLabel')} <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required disabled={placingOrder}/>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="checkoutEmailOptional">
                            <Form.Label>{t('checkoutPage.shippingInfo.emailLabel')}</Form.Label>
                            <Form.Control type="email" name="email" value={shippingInfo.email} onChange={handleInputChange} placeholder={t('checkoutPage.shippingInfo.emailPlaceholder')} disabled={placingOrder}/>
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-3" controlId="checkoutAddress">
                  <Form.Label>{t('checkoutPage.shippingInfo.addressLabel')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={3} name="address" value={shippingInfo.address} onChange={handleInputChange} required disabled={placingOrder} placeholder={t('checkoutPage.shippingInfo.addressPlaceholder')}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="checkoutNotes">
                  <Form.Label>{t('checkoutPage.shippingInfo.notesLabel')}</Form.Label>
                  <Form.Control as="textarea" rows={2} name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder={t('checkoutPage.shippingInfo.notesPlaceholder')} disabled={placingOrder}/>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="shadow-sm checkout-card">
              <Card.Header className="checkout-card-header"><h5 className="mb-0">{t('checkoutPage.paymentMethod.title')}</h5></Card.Header>
              <Card.Body>
                <Form.Check
                    type="radio"
                    id="cod-payment"
                    label={t('checkoutPage.paymentMethod.codLabel')}
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2 payment-method-option"
                    disabled={placingOrder}
                />
                <p className="text-muted small">{t('checkoutPage.paymentMethod.codDescription')}</p>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <div className="cart-summary-sticky">
                <Card className="shadow-sm checkout-card">
                <Card.Header className="checkout-card-header"><h5 className="mb-0">{t('checkoutPage.orderSummary.title', {count: totalItems})}</h5></Card.Header>
                <Card.Body>
                    <div className="checkout-items-summary-scroll">
                        <ListGroup variant="flush" className="mb-3 order-items-summary">
                        {cartItems.map(item => (
                            <ListGroup.Item key={item.cartItemId} className="d-flex justify-content-between align-items-center px-0 checkout-cart-item">
                            <div className="d-flex align-items-center">
                                <Image src={getFullImageUrl(item.imageUrl)} alt={item.name} className="checkout-item-image" onError={handleImageError}/>
                                <div>
                                    <span className="checkout-item-name">{item.name}</span>
                                    <small className="d-block text-muted checkout-item-variant">
                                        {item.size?.size_name && `${t('cartItem.sizeLabel')} ${item.size.size_name}`}
                                        {item.size?.size_name && item.color?.color_name && ' / '}
                                        {item.color?.color_name && `${t('cartItem.colorLabel')} ${item.color.color_name}`}
                                        {' | '}{t('cartItem.quantityShortLabel')}: {item.quantity}
                                    </small>
                                </div>
                            </div>
                            <span className="checkout-item-price">{formatCurrency(item.price * item.quantity, i18n.language)}</span>
                            </ListGroup.Item>
                        ))}
                        </ListGroup>
                    </div>

                    <ListGroup variant="flush" className="order-totals-summary">
                        <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('checkoutPage.orderSummary.subtotal')}</span> <span>{formatCurrency(totalPrice, i18n.language)}</span></ListGroup.Item>
                        {calculatedDiscount > 0 &&
                            <ListGroup.Item className="px-0 d-flex justify-content-between">
                                <span>{t('checkoutPage.orderSummary.balanceDiscount')}</span>
                                <span className="text-success">-{formatCurrency(calculatedDiscount, i18n.language)}</span>
                            </ListGroup.Item>
                        }
                        <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('checkoutPage.orderSummary.shippingFee')}</span> <span>{shippingFee > 0 ? formatCurrency(shippingFee, i18n.language) : t('cartSummary.freeShipping')}</span></ListGroup.Item>
                        <ListGroup.Item className="px-0 d-flex justify-content-between fw-bold h5 total-price-row text-primary"><span>{t('checkoutPage.orderSummary.totalAmount')}</span> <span>{formatCurrency(finalPrice, i18n.language)}</span></ListGroup.Item>
                       {calculatedDiscount > 0 && userInfo?.virtual_balance &&
                            <ListGroup.Item className="text-muted small px-0 pt-1 border-0">
                                {t('checkoutPage.orderSummary.remainingBalance', { balance: formatCurrency(userInfo.virtual_balance - calculatedDiscount, i18n.language)})}
                            </ListGroup.Item>
                        }
                    </ListGroup>

                    <div className="d-grid mt-4">
                    <Button variant="dark" size="lg" type="submit" form="checkout-form" disabled={placingOrder || cartItems.length === 0 || !isAuthenticated} className="place-order-btn">
                        {placingOrder ? (
                        <><Spinner size="sm" animation="border" className="me-2"/> {t('checkoutPage.processingButton')}</>
                        ) : (
                        <><i className="bi bi-shield-check-fill me-2"></i> {t('checkoutPage.placeOrderButton')}</>
                        )}
                    </Button>
                    </div>
                     {!isAuthenticated &&
                        <AlertMessage variant="warning" className="mt-3 text-center small">
                           <span dangerouslySetInnerHTML={{ __html: t('checkoutPage.loginToContinue', { loginLink: langLink('/login') }) }} />
                        </AlertMessage>
                    }
                </Card.Body>
                </Card>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default CheckoutPage;