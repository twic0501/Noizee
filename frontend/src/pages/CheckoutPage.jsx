// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Image, Spinner } from 'react-bootstrap';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, getFullImageUrl } from '../utils/formatters';
import { useMutation } from '@apollo/client';
import { CREATE_SALE_MUTATION } from '../api/graphql/mutations/cartMutations';
import AlertMessage from '../components/common/AlertMessage';
import { Link, useNavigate } from 'react-router-dom';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../utils/constants';
import './CheckoutPage.css'; // Tạo file CSS riêng

function CheckoutPage() {
  const { cartItems, totalPrice, clearCart, totalItems } = useCart();
  const { userInfo, updateVirtualBalance, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Mặc định là COD
  const [formError, setFormError] = useState('');
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null); // { message: '', orderId: null }

  // Điền thông tin user vào form khi component mount hoặc userInfo thay đổi
  useEffect(() => {
    if (userInfo) {
      setShippingInfo(prev => ({
        ...prev, // Giữ lại notes nếu đã nhập
        name: userInfo.customer_name || '',
        phone: userInfo.customer_tel || '',
        address: userInfo.customer_address || ''
      }));
    }
  }, [userInfo]);

  // Tính toán chiết khấu và tổng cuối
  const availableBalance = userInfo?.virtual_balance || 0;
  const discountPercentage = 0.10; // 10%
  const maxDiscountFromBalance = Math.min(totalPrice * discountPercentage, availableBalance);
  // Làm tròn xuống hàng nghìn cho số tiền giảm giá
  const calculatedDiscount = Math.floor(maxDiscountFromBalance / 1000) * 1000;
  const shippingFee = 0; // Tạm thời miễn phí
  const finalPrice = totalPrice + shippingFee - calculatedDiscount;


  const [createSale, { loading: placingOrder }] = useMutation(CREATE_SALE_MUTATION, {
    onCompleted: (data) => {
      const createdSale = data.createSale;
      setOrderSuccess({
        message: `Đơn hàng #${createdSale.sale_id} của bạn đã được đặt thành công!`,
        orderId: createdSale.sale_id
      });
      setOrderError(null);
      if (createdSale.customer?.virtual_balance !== undefined) {
        updateVirtualBalance(createdSale.customer.virtual_balance);
      }
      clearCart();
      // Không điều hướng ngay, để người dùng thấy thông báo thành công
      // setTimeout(() => navigate(`/account/orders/${createdSale.sale_id}`), 4000);
    },
    onError: (error) => {
      console.error("Failed to place order:", error);
      setOrderError(error.message || "Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.");
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
      setFormError("Vui lòng điền đầy đủ thông tin giao hàng (Họ tên, Số điện thoại, Địa chỉ).");
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(shippingInfo.phone.trim())) {
        setFormError("Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0.");
        return false;
    }
    return true;
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setFormError('');
    setOrderError(null);
    // setOrderSuccess(null); // Không reset success ở đây để user thấy thông báo

    if (!validateShippingInfo()) return;

    if (cartItems.length === 0) {
      setFormError("Giỏ hàng của bạn đang trống. Không thể đặt hàng.");
      return;
    }
    if (!isAuthenticated) {
        setFormError("Vui lòng đăng nhập để đặt hàng.");
        // Có thể điều hướng tới trang login: navigate('/login', { state: { from: location } });
        return;
    }

    const itemsInput = cartItems.map(item => ({
      product_id: item.productId,
      product_qty: item.quantity,
      sizeId: item.sizeId || null,
      colorId: item.colorId || null,
      // Không cần gửi price_at_sale hay discount_amount từ đây nếu backend tự tính toán
      // Dựa trên schema, backend sẽ lấy giá SP và tự tính discount nếu có logic
    }));

    console.log("Placing order with items:", itemsInput, "and shipping:", shippingInfo);
    // Thêm thông tin giao hàng vào mutation nếu backend yêu cầu
    // Ví dụ: variables: { items: itemsInput, shippingDetails: shippingInfo }
    createSale({ variables: { items: itemsInput } });
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
            <h2 className="success-title">Đặt hàng thành công!</h2>
            <p className="text-muted">{orderSuccess.message}</p>
            <p>Cảm ơn bạn đã mua sắm tại NOIZEE.</p>
            <div className="mt-4">
                <Button as={Link} to={`/account/orders/${orderSuccess.orderId}`} variant="dark" className="me-2 view-order-btn">
                    Xem chi tiết đơn hàng
                </Button>
                <Button as={Link} to="/collections" variant="outline-secondary" className="continue-shopping-success-btn">
                    Tiếp tục mua sắm
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
                  Giỏ hàng của bạn đang trống. <Link to="/collections">Hãy chọn lựa sản phẩm!</Link>
              </AlertMessage>
          </Container>
      )
  }


  return (
    <Container className="my-4 my-md-5 checkout-page">
      <div className="text-center mb-4">
         <h1 className="page-main-title">Thanh toán</h1>
      </div>
      <Form onSubmit={handlePlaceOrder} id="checkout-form">
        <Row className="g-4">
          <Col lg={7} className="mb-4 mb-lg-0">
            {/* Shipping Info Form */}
            <Card className="shadow-sm mb-4 checkout-card">
              <Card.Header className="checkout-card-header"><h5 className="mb-0">Thông tin giao hàng</h5></Card.Header>
              <Card.Body>
                {formError && <AlertMessage variant="danger" className="mb-3 text-start" dismissible onClose={() => setFormError('')}>{formError}</AlertMessage>}
                {orderError && <AlertMessage variant="danger" className="mb-3 text-start" dismissible onClose={() => setOrderError(null)}>{orderError}</AlertMessage>}

                <Form.Group className="mb-3" controlId="checkoutName">
                  <Form.Label>Họ và tên người nhận <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="name" value={shippingInfo.name} onChange={handleInputChange} required disabled={placingOrder}/>
                </Form.Group>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="checkoutPhone">
                        <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required disabled={placingOrder}/>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="checkoutEmailOptional">
                            <Form.Label>Email (tùy chọn)</Form.Label>
                            <Form.Control type="email" name="email" value={shippingInfo.email || userInfo?.customer_email || ''} onChange={handleInputChange} placeholder="Để nhận thông tin đơn hàng" disabled={placingOrder}/>
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-3" controlId="checkoutAddress">
                  <Form.Label>Địa chỉ nhận hàng <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={3} name="address" value={shippingInfo.address} onChange={handleInputChange} required disabled={placingOrder} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="checkoutNotes">
                  <Form.Label>Ghi chú cho đơn hàng (tùy chọn)</Form.Label>
                  <Form.Control as="textarea" rows={2} name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder="Ví dụ: Giao hàng trong giờ hành chính, gọi trước khi giao..." disabled={placingOrder}/>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-sm checkout-card">
              <Card.Header className="checkout-card-header"><h5 className="mb-0">Phương thức thanh toán</h5></Card.Header>
              <Card.Body>
                <Form.Check
                    type="radio"
                    id="cod-payment"
                    label="Thanh toán khi nhận hàng (COD)"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2 payment-method-option"
                    disabled={placingOrder}
                />
                <p className="text-muted small">Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được sản phẩm.</p>
                {/* Thêm các phương thức thanh toán khác nếu có */}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            {/* Order Summary */}
            <div className="cart-summary-sticky">
                <Card className="shadow-sm checkout-card">
                <Card.Header className="checkout-card-header"><h5 className="mb-0">Đơn hàng của bạn ({totalItems} sản phẩm)</h5></Card.Header>
                <Card.Body>
                    <div className="checkout-items-summary-scroll"> {/* Cho phép scroll nếu nhiều sản phẩm */}
                        <ListGroup variant="flush" className="mb-3 order-items-summary">
                        {cartItems.map(item => (
                            <ListGroup.Item key={item.cartItemId} className="d-flex justify-content-between align-items-center px-0 checkout-cart-item">
                            <div className="d-flex align-items-center">
                                <Image src={getFullImageUrl(item.imageUrl)} alt={item.name} className="checkout-item-image" onError={handleImageError}/>
                                <div>
                                    <span className="checkout-item-name">{item.name}</span>
                                    <small className="d-block text-muted checkout-item-variant">
                                        {item.size?.size_name && `Size: ${item.size.size_name}`}
                                        {item.size?.size_name && item.color?.color_name && ' / '}
                                        {item.color?.color_name && `Màu: ${item.color.color_name}`}
                                        {' | '}SL: {item.quantity}
                                    </small>
                                </div>
                            </div>
                            <span className="checkout-item-price">{formatCurrency(item.price * item.quantity)}</span>
                            </ListGroup.Item>
                        ))}
                        </ListGroup>
                    </div>

                    <ListGroup variant="flush" className="order-totals-summary">
                        <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Tạm tính</span> <span>{formatCurrency(totalPrice)}</span></ListGroup.Item>
                        {calculatedDiscount > 0 &&
                            <ListGroup.Item className="px-0 d-flex justify-content-between">
                                <span>Sử dụng số dư NOIZEE</span>
                                <span className="text-success">-{formatCurrency(calculatedDiscount)}</span>
                            </ListGroup.Item>
                        }
                        <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Phí vận chuyển</span> <span>{shippingFee > 0 ? formatCurrency(shippingFee) : 'Miễn phí'}</span></ListGroup.Item>
                        <ListGroup.Item className="px-0 d-flex justify-content-between fw-bold h5 total-price-row text-primary"><span>Tổng cộng</span> <span>{formatCurrency(finalPrice)}</span></ListGroup.Item>
                       {calculatedDiscount > 0 && userInfo?.virtual_balance &&
                            <ListGroup.Item className="text-muted small px-0 pt-1 border-0">
                                (Số dư còn lại: {formatCurrency(userInfo.virtual_balance - calculatedDiscount)})
                            </ListGroup.Item>
                        }
                    </ListGroup>

                    <div className="d-grid mt-4">
                    <Button variant="dark" size="lg" type="submit" form="checkout-form" disabled={placingOrder || cartItems.length === 0 || !isAuthenticated} className="place-order-btn">
                        {placingOrder ? (
                        <><Spinner size="sm" animation="border" className="me-2"/> Đang xử lý...</>
                        ) : (
                        <><i className="bi bi-shield-check-fill me-2"></i> Đặt hàng ngay</>
                        )}
                    </Button>
                    </div>
                     {!isAuthenticated &&
                        <AlertMessage variant="warning" className="mt-3 text-center small">
                            Vui lòng <Link to="/login" state={{ from: location }}>đăng nhập</Link> để tiếp tục đặt hàng.
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