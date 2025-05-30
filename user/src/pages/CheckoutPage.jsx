// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, Info, Lock, Truck, CheckCircle, ShoppingCart } from 'lucide-react'; // Giữ lại các icon cần thiết

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { GET_ME_QUERY } from '../api/graphql/userQueries'; // Để lấy thông tin user
import { CREATE_ORDER_MUTATION } from '../api/graphql/orderMutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import OptimizedImage from '../components/common/OptimizedImage';
import { formatPrice } from '../utils/formatters';
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../utils/constants';

// --- Helper Components (Giữ lại từ thiết kế mới của bạn) ---
const InputField = ({ id, label, type = 'text', placeholder, value, onChange, error, required = false, icon, halfWidth = false, autoComplete = "off", children, disabled = false, name }) => (
    <div className={`mb-3 ${halfWidth ? 'col-md-6' : 'col-12'}`}>
        {label && <label htmlFor={id} className="form-label small text-muted">{label} {required && <span className="text-danger">*</span>}</label>}
        <div className="input-group input-group-sm"> {/* input-group-sm cho input nhỏ hơn */}
            {icon && <span className="input-group-text bg-light border-end-0">{icon}</span>}
            <input type={type} id={id} name={name || id} placeholder={placeholder} value={value} onChange={onChange} required={required} disabled={disabled} autoComplete={autoComplete}
                   className={`form-control form-control-sm ${error ? 'is-invalid' : ''} ${icon ? 'border-start-0' : ''}`} />
            {children && <div className="input-group-text">{children}</div>}
        </div>
        {error && <div className="invalid-feedback d-block small">{error}</div>}
    </div>
);

const SelectField = ({ id, label, value, onChange, options, required = false, halfWidth = false, name }) => (
    <div className={`mb-3 ${halfWidth ? 'col-md-6' : 'col-12'}`}>
        <label htmlFor={id} className="form-label small text-muted">{label} {required && <span className="text-danger">*</span>}</label>
        <select id={id} name={name || id} value={value} onChange={onChange} required={required} className="form-select form-select-sm">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);
// --- End Helper Components ---

const CheckoutPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { authState } = useAuth();
    const { cart, clearCart: clearCartContext, cartError: cartContextError, isLoading: cartLoading } = useCart();

    const [formData, setFormData] = useState({
        email: authState.user?.email || '',
        newsOffers: true,
        country: 'Vietnam', // Mặc định
        firstName: authState.user?.firstName || '',
        lastName: authState.user?.lastName || '',
        address: authState.user?.address || '', // Giả sử address là một chuỗi
        apartment: '',
        city: '', // Sẽ cần logic để lấy từ address chi tiết nếu có
        postalCode: '',
        phone: authState.user?.phoneNumber || '',
        // Thông tin thanh toán (ví dụ)
        ccNumber: '',
        ccExpiry: '',
        ccCvc: '',
        ccName: '',
        saveInfo: true,
        paymentMethod: 'cod', // Mặc định là COD
        orderNotes: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [orderPlacedData, setOrderPlacedData] = useState(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Success

    // Query để lấy thông tin chi tiết của người dùng nếu chưa có trong authState
    // (có thể không cần nếu authState.user đã đủ thông tin)
    useQuery(GET_ME_QUERY, {
        skip: !authState.isAuthenticated || !!authState.user?.address, // Bỏ qua nếu không đăng nhập hoặc đã có địa chỉ
        onCompleted: (data) => {
            if (data?.myProfile && !formData.address) { // Chỉ cập nhật nếu form chưa có địa chỉ
                setFormData(prev => ({
                    ...prev,
                    firstName: data.myProfile.customer_name?.split(' ')[0] || prev.firstName,
                    lastName: data.myProfile.customer_name?.split(' ').slice(1).join(' ') || prev.lastName,
                    email: data.myProfile.customer_email || prev.email,
                    phone: data.myProfile.customer_tel || prev.phone,
                    address: data.myProfile.customer_address || prev.address,
                    // Cần logic để tách city, postalCode từ customer_address nếu có
                }));
            }
        }
    });

    const [createOrder, { loading: creatingOrder, error: createOrderError }] = useMutation(CREATE_ORDER_MUTATION, {
        onCompleted: (data) => {
            if (data.createOrder) {
                setOrderPlacedData(data.createOrder);
                clearCartContext();
                setCurrentStep(2); // Chuyển sang trang thành công
                window.scrollTo(0, 0);
            }
        },
        onError: (err) => {
            console.error("Error creating order:", err);
            setFormErrors(prev => ({ ...prev, submit: err.message || t('checkout.placeOrderError') }));
        }
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
        if (formErrors.submit) {
            setFormErrors(prev => ({ ...prev, submit: null}));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.email.trim()) errors.email = t('validation.emailRequired');
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t('validation.emailInvalid');
        if (!formData.firstName.trim()) errors.firstName = t('validation.firstNameRequired');
        if (!formData.lastName.trim()) errors.lastName = t('validation.lastNameRequired');
        if (!formData.address.trim()) errors.address = t('validation.streetRequired'); // "Địa chỉ cụ thể"
        if (!formData.city.trim()) errors.city = "Vui lòng nhập thành phố."; // Cần key dịch
        if (!formData.postalCode.trim()) errors.postalCode = "Vui lòng nhập mã bưu điện."; // Cần key dịch
        if (!formData.phone.trim()) errors.phone = t('validation.phoneNumberRequired');
        // Thêm validation cho thẻ tín dụng nếu paymentMethod là 'credit_card'
        if (formData.paymentMethod === 'credit_card') {
            if (!formData.ccNumber.trim()) errors.ccNumber = "Vui lòng nhập số thẻ.";
            if (!formData.ccExpiry.trim()) errors.ccExpiry = "Vui lòng nhập ngày hết hạn.";
            if (!formData.ccCvc.trim()) errors.ccCvc = "Vui lòng nhập mã CVC.";
            if (!formData.ccName.trim()) errors.ccName = "Vui lòng nhập tên trên thẻ.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            // Hiển thị modal lỗi chung nếu cần, hoặc dựa vào error message của từng field
            const firstErrorKey = Object.keys(formErrors).find(key => formErrors[key]);
            if (firstErrorKey) {
                const errorFieldElement = document.getElementById(firstErrorKey);
                errorFieldElement?.focus();
            }
            return;
        }

        const orderInput = {
            // cartId: cart.id, // Backend có thể lấy cartId từ user session
            shippingAddress: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                street: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country,
                phoneNumber: formData.phone,
            },
            // billingAddress: { ... }, // Nếu khác
            paymentMethodId: formData.paymentMethod, // Hoặc một ID cụ thể nếu backend yêu cầu
            notes: formData.orderNotes,
            // items: cart.items.map(item => ({ // Backend có thể tự lấy items từ cart
            //     productId: item.product.id,
            //     variantId: item.variant?.id, // Hoặc inventoryId
            //     quantity: item.quantity,
            //     price: item.price // Giá tại thời điểm đặt hàng
            // })),
            // totalAmount: grandTotal, // Backend nên tự tính toán lại
        };

        try {
            await createOrder({ variables: { input: orderInput } });
        } catch (err) {
            // Lỗi đã được xử lý bởi onError của useMutation
            console.error("Submit order error caught in component:", err);
        }
    };

    const countryOptions = [
        { value: 'Vietnam', label: 'Việt Nam' },
        { value: 'USA', label: 'Hoa Kỳ (United States)' },
        { value: 'Canada', label: 'Canada' },
    ];

    const paymentMethods = [
        { id: 'cod', label: t('checkout.payment.cod', 'Thanh toán khi nhận hàng (COD)') },
        // { id: 'credit_card', label: 'Thẻ tín dụng' },
        // { id: 'paypal', label: 'PayPal' },
    ];


    if (cartLoading && !cart) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <LoadingSpinner size="lg" message={t('cart.loadingCart')} />
            </div>
        );
    }
    if (!cart && !cartLoading) { // Nếu không loading mà vẫn không có cart (ví dụ lỗi fetch cart ban đầu)
         return (
            <div className="container my-4">
                <AlertMessage type="error" title={t('cart.errorTitle')} message={cartContextError?.message || "Không thể tải thông tin giỏ hàng."} />
            </div>
        );
    }


    if (currentStep === 2 && orderPlacedData) {
        return (
            <div className="container text-center py-5" style={{ marginTop: '80px', minHeight: 'calc(100vh - 250px)' }}>
                <CheckCircle size={60} className="mx-auto text-success mb-4" />
                <h1 className="h4 fw-bold mb-3">{t('checkout.orderSuccessTitle')}</h1>
                <p className="text-muted">
                    {t('checkout.orderSuccessMessage')} <strong className="text-dark">{orderPlacedData.order_number || orderPlacedData.id}</strong>.
                </p>
                <p className="text-muted mb-4">{t('checkout.orderSuccessNextSteps')}</p>
                <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                    <button onClick={() => navigate(`/account/orders/${orderPlacedData.id}`)} className="btn btn-dark px-4 py-2">
                        {t('checkout.viewOrderButton')}
                    </button>
                    <button onClick={() => navigate('/products')} className="btn btn-outline-secondary px-4 py-2">
                        {t('cart.continueShoppingButton')}
                    </button>
                </div>
            </div>
        );
    }

    if (cart.items.length === 0 && currentStep !== 2) {
        return (
            <div className="container text-center py-5" style={{ marginTop: '80px', minHeight: 'calc(100vh - 250px)' }}>
                 <ShoppingCart size={60} className="mx-auto text-muted mb-4"/>
                <p className="h5 text-muted mb-4">{t('checkout.emptyCartPrompt')}</p>
                <button onClick={() => navigate('/products')} className="btn btn-dark btn-lg text-uppercase">
                    {t('cart.continueShoppingButton')}
                </button>
            </div>
        );
    }

    const subtotal = cart?.subtotal || 0;
    const shippingCost = cart?.shippingCost || 0; // Giả sử là 0 nếu chưa tính
    const grandTotal = cart?.total || subtotal + shippingCost;


    return (
        <div className="bg-light min-vh-100">
            <main className="container py-4 py-md-5" style={{ marginTop: '80px' }}>
                <div className="row g-4 g-lg-5">
                    {/* Order Form Section */}
                    <div className="col-lg-7 order-lg-0 order-1">
                        <form onSubmit={handleSubmitOrder} className="needs-validation" noValidate>
                            {/* Optional: Express Checkout */}
                            {/* <div className="text-center mb-4"> ... </div> */}

                            <section className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5 className="mb-0 text-uppercase small fw-bold">Liên hệ</h5>
                                    {!authState.isAuthenticated && (
                                        <span className="small text-muted">
                                            {t('auth.alreadyHaveAccountPrompt')}{' '}
                                            <Link to="/login" state={{ from: location }} className="text-dark fw-medium text-decoration-none">
                                                {t('auth.loginButton')}
                                            </Link>
                                        </span>
                                    )}
                                </div>
                                <InputField id="email" name="email" type="email" placeholder="Địa chỉ email" value={formData.email} onChange={handleInputChange} required error={formErrors.email} />
                                <div className="form-check small mt-n2">
                                    <input type="checkbox" name="newsOffers" checked={formData.newsOffers} onChange={handleInputChange} className="form-check-input" id="newsOffersCheckout"/>
                                    <label className="form-check-label text-muted" htmlFor="newsOffersCheckout">Gửi email cho tôi về tin tức và ưu đãi</label>
                                </div>
                            </section>

                            <section className="mb-4">
                                <h5 className="mb-2 text-uppercase small fw-bold">Giao hàng</h5>
                                {/* <div className="alert alert-secondary small p-2 d-flex align-items-center" role="alert">
                                    <Info size={16} className="me-2 flex-shrink-0"/> Vui lòng cung cấp tất cả thông tin bằng tiếng Anh.
                                </div> */}
                                <div className="row">
                                    <SelectField id="country" name="country" value={formData.country} onChange={handleInputChange} options={countryOptions} required />
                                    <InputField id="firstName" name="firstName" placeholder="Tên" value={formData.firstName} onChange={handleInputChange} required halfWidth error={formErrors.firstName} />
                                    <InputField id="lastName" name="lastName" placeholder="Họ" value={formData.lastName} onChange={handleInputChange} required halfWidth error={formErrors.lastName} />
                                    <InputField id="address" name="address" placeholder="Địa chỉ (số nhà, đường)" value={formData.address} onChange={handleInputChange} required error={formErrors.address} />
                                    <InputField id="apartment" name="apartment" placeholder="Căn hộ, phòng, etc. (tùy chọn)" value={formData.apartment} onChange={handleInputChange} />
                                    <InputField id="city" name="city" placeholder="Thành phố" value={formData.city} onChange={handleInputChange} required halfWidth error={formErrors.city}/>
                                    <InputField id="postalCode" name="postalCode" placeholder="Mã bưu điện" value={formData.postalCode} onChange={handleInputChange} required halfWidth error={formErrors.postalCode} />
                                    <InputField id="phone" name="phone" type="tel" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} required error={formErrors.phone} />
                                </div>
                            </section>

                            <section className="mb-4">
                                <h5 className="mb-2 text-uppercase small fw-bold">Phương thức vận chuyển</h5>
                                <div className="border rounded p-3 bg-white">
                                    <div className="d-flex justify-content-between align-items-center small">
                                        <div className="d-flex align-items-center">
                                            <Truck size={18} className="me-2 text-muted"/>
                                            <span>Giao hàng tiêu chuẩn</span>
                                        </div>
                                        <span className="fw-bold text-dark">{shippingCost > 0 ? formatPrice(shippingCost) : "Miễn phí"}</span>
                                    </div>
                                    {/* <p className="small text-muted mt-1 mb-0" style={{fontSize: '0.75rem'}}>Dự kiến giao hàng: 5-10 ngày làm việc</p> */}
                                </div>
                            </section>

                            <section className="mb-4">
                                <h5 className="mb-1 text-uppercase small fw-bold">Thanh toán</h5>
                                <p className="small text-muted mb-2">Tất cả giao dịch đều được bảo mật và mã hóa.</p>
                                <div className="border rounded bg-white">
                                    {paymentMethods.map(method => (
                                        <div key={method.id} className={`p-3 ${formData.paymentMethod === method.id ? 'bg-light border-dark' : ''}`}>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="paymentMethod"
                                                    id={`payment-${method.id}`}
                                                    value={method.id}
                                                    checked={formData.paymentMethod === method.id}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label small fw-medium text-dark" htmlFor={`payment-${method.id}`}>
                                                    {method.label}
                                                </label>
                                            </div>
                                            {method.id === 'credit_card' && formData.paymentMethod === 'credit_card' && (
                                                <div className="mt-2 ps-4">
                                                    <InputField id="ccNumber" name="ccNumber" placeholder="Số thẻ" value={formData.ccNumber} onChange={handleInputChange} required icon={<CreditCard size={16} className="text-muted"/>} error={formErrors.ccNumber} />
                                                    <div className="row">
                                                        <InputField id="ccExpiry" name="ccExpiry" placeholder="Ngày hết hạn (MM/YY)" value={formData.ccExpiry} onChange={handleInputChange} required halfWidth error={formErrors.ccExpiry} />
                                                        <InputField id="ccCvc" name="ccCvc" placeholder="Mã bảo mật" value={formData.ccCvc} onChange={handleInputChange} required halfWidth icon={<Info size={16} className="text-muted"/>} error={formErrors.ccCvc} />
                                                    </div>
                                                    <InputField id="ccName" name="ccName" placeholder="Tên trên thẻ" value={formData.ccName} onChange={handleInputChange} required error={formErrors.ccName} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                             <section className="mb-4">
                                <h5 className="mb-2 text-uppercase small fw-bold">Ghi chú đơn hàng</h5>
                                <textarea
                                    id="orderNotes"
                                    name="orderNotes"
                                    rows="3"
                                    value={formData.orderNotes}
                                    onChange={handleInputChange}
                                    className="form-control form-control-sm"
                                    placeholder={t('checkout.orderNotesPlaceholder')}
                                    disabled={creatingOrder}
                                />
                            </section>

                            <section>
                                <div className="form-check small mb-3">
                                    <input type="checkbox" name="saveInfo" checked={formData.saveInfo} onChange={handleInputChange} className="form-check-input" id="saveInfoCheckout"/>
                                    <label className="form-check-label text-muted" htmlFor="saveInfoCheckout">Lưu thông tin của tôi để thanh toán nhanh hơn</label>
                                </div>
                                {formErrors.submit && <AlertMessage type="error" message={formErrors.submit} className="mb-3"/>}
                                <button type="submit" className="btn btn-dark btn-lg w-100 text-uppercase d-flex align-items-center justify-content-center py-2" disabled={creatingOrder}>
                                    {creatingOrder ? (
                                        <LoadingSpinner size="sm" color="text-white" className="me-2" />
                                    ) : (
                                        <Lock size={16} className="me-2"/>
                                    )}
                                    {creatingOrder ? "Đang xử lý..." : t('checkout.placeOrderButton')}
                                </button>
                                <p className="small text-muted mt-3 text-center" style={{fontSize: '0.7rem'}}>
                                    Bằng cách tiếp tục, bạn đồng ý với <Link to="/terms" className="text-dark fw-medium text-decoration-none">Điều khoản dịch vụ</Link> và xác nhận <Link to="/privacy" className="text-dark fw-medium text-decoration-none">Chính sách bảo mật</Link> của Shop.
                                </p>
                            </section>
                        </form>
                    </div>

                    {/* Order Summary Section */}
                    <div className="col-lg-5 order-lg-1 order-0">
                        <div className="sticky-top" style={{ top: 'calc(80px + 1rem)' }}> {/* Điều chỉnh top cho header cố định */}
                            <div className="bg-white p-3 p-md-4 rounded border shadow-sm">
                                <h5 className="mb-3 text-uppercase small fw-bold">Tóm tắt đơn hàng</h5>
                                {cart.items.length > 0 ? (
                                    <ul className="list-unstyled mb-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                        {cart.items.map(item => {
                                            const product = item.product || {};
                                            const itemImage = product.images?.[0]?.image_url;
                                            return (
                                                <li key={item.id} className="d-flex align-items-start py-2 border-bottom">
                                                    <div className="position-relative me-3 flex-shrink-0">
                                                        <OptimizedImage
                                                            src={getFullImageUrl(itemImage)}
                                                            alt={`[Hình ảnh của ${product.name}]`}
                                                            containerClassName="border rounded overflow-hidden"
                                                            style={{ width: '64px', height: '80px' }}
                                                            objectFitClass="object-fit-cover"
                                                        />
                                                        <span className="badge bg-dark text-white rounded-pill position-absolute top-0 start-100 translate-middle small" style={{ fontSize: '0.6rem', padding: '0.25em 0.5em' }}>{item.quantity}</span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-0 small fw-medium text-dark">{product.name || "Tên sản phẩm"}</h6>
                                                        <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {item.selectedColor?.name || product.color?.name || ''}
                                                            {(item.selectedColor?.name || product.color?.name) && (item.selectedSize?.name || product.size?.name) ? ' / ' : ''}
                                                            {item.selectedSize?.name || product.size?.name || ''}
                                                        </p>
                                                    </div>
                                                    <div className="small fw-medium text-dark">{formatPrice(item.price * item.quantity)}</div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (<p className="small text-muted">Không có sản phẩm nào.</p>)}

                                {cart.items.length > 0 && (
                                    <>
                                        {/* <div className="input-group mt-4 mb-3">
                                            <input type="text" className="form-control form-control-sm" placeholder="Mã giảm giá"/>
                                            <button className="btn btn-outline-secondary btn-sm" type="button">Áp dụng</button>
                                        </div> */}
                                        <hr className="my-3"/>
                                        <div className="d-flex justify-content-between small mb-1"><p className="text-muted mb-0">{t('cart.subtotal', 'Tạm tính')}</p><p className="fw-medium text-dark mb-0">{formatPrice(subtotal)}</p></div>
                                        <div className="d-flex justify-content-between small mb-1"><p className="text-muted mb-0">{t('cart.shipping', 'Vận chuyển')}</p><p className="fw-medium text-dark mb-0">{shippingCost > 0 ? formatPrice(shippingCost) : "Miễn phí"}</p></div>
                                        <hr className="my-3"/>
                                        <div className="d-flex justify-content-between fw-bold h6 mb-0"><p className="mb-0">{t('cart.total', 'Tổng cộng')}</p><p className="mb-0">USD {formatPrice(grandTotal)}</p></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Footer is rendered by MainLayout */}
        </div>
    );
};

export default CheckoutPage;
