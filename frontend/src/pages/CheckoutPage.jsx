import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Image, Spinner } from 'react-bootstrap';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, getFullImageUrl } from '@noizee/shared-utils';
import { useMutation } from '@apollo/client';
import { CREATE_SALE_MUTATION } from '../api/graphql/mutations/cartMutations';
import AlertMessage from '@noizee/ui-components';
import { Link, useNavigate } from 'react-router-dom';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { userInfo, updateVirtualBalance } = useAuth();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({ name: userInfo?.customer_name || '', phone: userInfo?.customer_tel || '', address: userInfo?.customer_address || '', notes: '' });
  const [formError, setFormError] = useState('');
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const availableBalance = userInfo?.virtual_balance || 0;
  const discountPercentage = 0.10;
  const maxDiscountFromBalance = availableBalance;
  const calculatedDiscount = Math.min(totalPrice * discountPercentage, maxDiscountFromBalance);
  const finalPrice = totalPrice - calculatedDiscount;

  const [createSale, { loading: placingOrder }] = useMutation(CREATE_SALE_MUTATION, {
      onCompleted: (data) => {
          console.log("Order placed:", data); setOrderSuccess(`Order #${data.createSale.sale_id} placed successfully!`); setOrderError(null);
          if (data.createSale.customer?.virtual_balance !== undefined) { updateVirtualBalance(data.createSale.customer.virtual_balance); }
          clearCart(); setTimeout(() => navigate('/account/orders'), 3000);
      },
      onError: (error) => { console.error("Failed to place order:", error); setOrderError(error.message || "Failed to place order. Please try again."); setOrderSuccess(null); }
  });

  const handleInputChange = (e) => { const { name, value } = e.target; setShippingInfo(prev => ({ ...prev, [name]: value })); setFormError(''); };

  const handlePlaceOrder = (e) => {
    e.preventDefault(); setFormError(''); setOrderError(null); setOrderSuccess(null);
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) { setFormError("Please fill in all required shipping details."); return; }
    if (cartItems.length === 0) { setFormError("Your cart is empty."); return; }

    // <<< ĐẢM BẢO GỬI sizeId, colorId >>>
    const itemsInput = cartItems.map(item => ({
        product_id: item.productId,
        product_qty: item.quantity,
        sizeId: item.sizeId || null,     // Lấy từ cart item đã lưu
        colorId: item.colorId || null,    // Lấy từ cart item đã lưu
    }));
    // <<< KẾT THÚC SỬA >>>

    console.log("Placing order with items:", itemsInput);
    createSale({ variables: { items: itemsInput } });
  };

   const handleImageError = (e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; };

  if (orderSuccess) { return ( <Container className="my-4 my-md-5 text-center"> <AlertMessage variant="success">{orderSuccess}</AlertMessage> <p>You will be redirected shortly...</p> <Link to="/collections">Continue Shopping</Link> </Container> ); }

  return (
    <Container className="my-4 my-md-5">
      <h1 className="mb-4 page-title">Checkout</h1>
      <Row>
        <Col lg={7} className="mb-4 mb-lg-0">
          {/* Shipping Info Form */}
           <Card className="shadow-sm mb-4">
             <Card.Header><h5 className="mb-0">Shipping Information</h5></Card.Header>
             <Card.Body> <Form onSubmit={handlePlaceOrder} id="checkout-form"> {formError && <AlertMessage variant="danger" className="mb-3">{formError}</AlertMessage>} <Form.Group className="mb-3" controlId="checkoutName"> <Form.Label>Full Name <span className="text-danger">*</span></Form.Label> <Form.Control type="text" name="name" value={shippingInfo.name} onChange={handleInputChange} required disabled={placingOrder}/> </Form.Group> <Form.Group className="mb-3" controlId="checkoutPhone"> <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label> <Form.Control type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required disabled={placingOrder}/> </Form.Group> <Form.Group className="mb-3" controlId="checkoutAddress"> <Form.Label>Shipping Address <span className="text-danger">*</span></Form.Label> <Form.Control as="textarea" rows={3} name="address" value={shippingInfo.address} onChange={handleInputChange} required disabled={placingOrder}/> </Form.Group> <Form.Group className="mb-3" controlId="checkoutNotes"> <Form.Label>Order Notes (Optional)</Form.Label> <Form.Control as="textarea" rows={2} name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder="Notes about your order, e.g. special notes for delivery." disabled={placingOrder}/> </Form.Group> </Form> </Card.Body>
           </Card>
           {/* Payment Method */}
            <Card className="shadow-sm">
              <Card.Header><h5 className="mb-0">Payment Method</h5></Card.Header>
              <Card.Body> <Form.Check type="radio" id="cod-payment" label="Cash on Delivery (COD)" name="paymentMethod" value="cod" checked readOnly className="mb-2"/> <p className="text-muted small">Pay with cash upon delivery.</p> </Card.Body>
            </Card>
        </Col>
        <Col lg={5}>
           {/* Order Summary */}
           <Card className="shadow-sm sticky-top" style={{ top: '100px' }}>
             <Card.Header><h5 className="mb-0">Your Order</h5></Card.Header>
             <Card.Body>
               <ListGroup variant="flush" className="mb-3 order-items-summary">
                 {cartItems.map(item => (
                   <ListGroup.Item key={item.cartItemId} className="d-flex justify-content-between align-items-center px-0">
                     <div className="d-flex align-items-center">
                       <Image src={getFullImageUrl(item.imageUrl)} alt={item.name} style={{ width: '40px', height: 'auto', maxHeight: '40px', objectFit: 'contain', marginRight: '10px' }} rounded onError={handleImageError}/>
                       <div> <span className="item-name">{item.name}</span> <small className="d-block text-muted">Size: {item.size?.size_name || '-'}, Color: {item.color?.color_name || '-'} | Qty: {item.quantity}</small> </div>
                     </div> <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                   </ListGroup.Item>
                 ))}
               </ListGroup>
               <ListGroup variant="flush" className="order-totals-summary">
                 <ListGroup.Item className="d-flex justify-content-between px-0"> <span>Subtotal</span> <span>{formatCurrency(totalPrice)}</span> </ListGroup.Item>
                 <ListGroup.Item className="d-flex justify-content-between px-0"> <span>Virtual Balance Applied</span> <span className="text-success">-{formatCurrency(calculatedDiscount)}</span> </ListGroup.Item>
                 <ListGroup.Item className="d-flex justify-content-between px-0"> <span>Shipping</span> <span>Free</span> </ListGroup.Item>
                 <ListGroup.Item className="d-flex justify-content-between fw-bold h5 px-0"> <span>Total</span> <span>{formatCurrency(finalPrice)}</span> </ListGroup.Item>
                 {availableBalance > 0 && ( <ListGroup.Item className="text-muted small px-0 pt-2"> * 10% discount applied (max {formatCurrency(calculatedDiscount)}). Remaining Balance: {formatCurrency(availableBalance - calculatedDiscount)}. </ListGroup.Item> )}
               </ListGroup>
               {orderError && <AlertMessage variant="danger" className="mt-3">{orderError}</AlertMessage>}
               <div className="d-grid mt-3">
                 <Button variant="dark" size="lg" onClick={handlePlaceOrder} form="checkout-form" disabled={placingOrder || cartItems.length === 0} > {placingOrder ? (<><Spinner size="sm" animation="border" className="me-1"/> Placing Order...</> ) : 'Place Order'} </Button>
               </div>
             </Card.Body>
           </Card>
         </Col>
      </Row>
    </Container>
  );
}
export default CheckoutPage;