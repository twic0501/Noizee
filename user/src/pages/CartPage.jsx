// src/pages/CartPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShoppingCart, Plus, Minus, X as CloseIcon } from 'lucide-react';

import { useCart } from '../contexts/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import OptimizedImage from '../components/common/OptimizedImage';
import { formatPrice } from '../utils/formatters';
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../utils/constants';

const CartPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        cart,
        isLoading,
        cartError,
        updateCartItem, // Hàm này cần input: { cartItemId: ID!, quantity: Int! }
        removeFromCart, // Hàm này cần input: cartItemId: ID!
        clearCart,      // Hàm này không cần input
        clearCartError
    } = useCart();

    const handleUpdateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return; // Số lượng không thể nhỏ hơn 1
        // Giả sử item trong cart có id là cartItemId
        try {
            await updateCartItem({ cartItemId, quantity: newQuantity });
        } catch (error) {
            console.error("Failed to update cart item quantity:", error);
            // Hiển thị thông báo lỗi cho người dùng nếu cần
        }
    };

    const handleRemoveItem = async (cartItemId) => {
        try {
            await removeFromCart(cartItemId);
        } catch (error) {
            console.error("Failed to remove item from cart:", error);
        }
    };

    const handleContinueShopping = (targetPage = 'collections') => {
        // 'collections' là ví dụ, bạn có thể muốn điều hướng đến trang sản phẩm chung
        navigate(targetPage === 'collections' ? '/collections' : '/products');
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const getFullImageUrl = (relativePath) => {
        if (!relativePath) return PRODUCT_IMAGE_PLACEHOLDER;
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
            return relativePath;
        }
        return `${API_BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    };


    if (isLoading && (!cart || cart.items.length === 0)) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <LoadingSpinner size="lg" message={t('cart.loadingCart', 'Đang tải giỏ hàng...')} />
            </div>
        );
    }

    if (cartError) {
        return (
            <div className="container my-4">
                <AlertMessage type="error" title={t('cart.errorTitle')} message={cartError.message || cartError} onClose={clearCartError} />
            </div>
        );
    }

    const subtotal = cart?.subtotal || 0; // Lấy từ cart object nếu có, nếu không thì tính lại
    const totalItems = cart?.itemCount || 0;
    // const shippingCost = cart?.shippingCost || 0; // Giả sử có
    // const tax = cart?.taxAmount || 0; // Giả sử có
    const grandTotal = cart?.total || subtotal; // Lấy từ cart object nếu có


    if (!cart || cart.items.length === 0) {
        return (
            <div className="container text-center py-5" style={{ marginTop: '80px', minHeight: 'calc(100vh - 250px)' }}>
                <ShoppingCart size={60} className="mx-auto text-muted mb-4"/>
                <h1 className="h4 fw-bold mb-3">{t('cart.emptyTitle', 'Giỏ hàng của bạn đang trống')}</h1>
                <p className="text-muted mb-4">{t('cart.emptyPrompt', 'Có vẻ bạn chưa thêm sản phẩm nào.')}</p>
                <button onClick={() => handleContinueShopping()} className="btn btn-dark btn-lg text-uppercase px-4">
                    {t('cart.continueShoppingButton', 'Tiếp tục mua sắm')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-light text-dark" style={{ minHeight: '100vh' }}>
            <main className="container py-4 py-md-5" style={{ marginTop: '80px' }}> {/* Giả sử header cao 80px */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button onClick={() => handleContinueShopping()} className="btn btn-link text-dark text-decoration-none ps-0 d-flex align-items-center small">
                        <ArrowLeft size={16} className="me-1" /> {t('cart.continueShopping', 'Tiếp tục mua sắm')}
                    </button>
                    <h1 className="h4 text-uppercase fw-bold mb-0">{t('cart.pageTitle', 'Giỏ hàng')}</h1>
                    <span className="small text-muted">{totalItems} {t('cart.items', 'Sản phẩm')}</span>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-0">
                                {cart.items.map(item => {
                                    const product = item.product || {};
                                    const itemImage = product.images?.[0]?.image_url; // Giả sử images là mảng và lấy ảnh đầu tiên
                                    const colorName = item.selectedColor?.name || product.color?.name || ''; // Lấy màu từ item hoặc product
                                    const sizeName = item.selectedSize?.name || product.size?.name || ''; // Lấy size từ item hoặc product

                                    return (
                                        <div key={item.id} className="p-3 border-bottom">
                                            <div className="row align-items-center g-3">
                                                <div className="col-12 col-sm-2 text-center text-sm-start">
                                                    <OptimizedImage
                                                        src={getFullImageUrl(itemImage)}
                                                        alt={`[Hình ảnh của ${product.name}]`}
                                                        containerClassName="d-inline-block border rounded overflow-hidden"
                                                        imageClassName="img-fluid" // Để Bootstrap xử lý responsive
                                                        style={{ width: '80px', height: '100px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div className="col-12 col-sm-4">
                                                    <h6 className="mb-1 small fw-medium">
                                                        <Link to={`/product/${product.slug || product.id}`} className="text-dark text-decoration-none">
                                                            {product.name || "Tên sản phẩm"}
                                                        </Link>
                                                    </h6>
                                                    {(colorName || sizeName) && (
                                                        <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {colorName && `${t('product.color', 'Màu')}: ${colorName}`}
                                                            {colorName && sizeName && ' / '}
                                                            {sizeName && `${t('product.size', 'Cỡ')}: ${sizeName}`}
                                                        </p>
                                                    )}
                                                    <p className="fw-bold d-sm-none mt-1 small mb-0">{formatPrice(item.price)}</p>
                                                </div>
                                                <div className="col-4 col-sm-2 text-sm-center">
                                                    <p className="mb-0 fw-medium small d-none d-sm-block">{formatPrice(item.price)}</p>
                                                </div>
                                                <div className="col-4 col-sm-2">
                                                    <div className="input-group input-group-sm border rounded" style={{maxWidth: '100px'}}>
                                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isLoading} className="btn btn-link text-dark px-2 py-1 border-end" style={{lineHeight: 1}}><Minus size={12}/></button>
                                                        <input type="text" className="form-control text-center border-0 px-1 py-1 bg-transparent small" value={item.quantity} readOnly style={{boxShadow: 'none'}}/>
                                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={isLoading} className="btn btn-link text-dark px-2 py-1 border-start" style={{lineHeight: 1}}><Plus size={12}/></button>
                                                    </div>
                                                </div>
                                                <div className="col-2 col-sm-1 text-end fw-bold small">{formatPrice(item.price * item.quantity)}</div>
                                                <div className="col-2 col-sm-1 text-end">
                                                    <button onClick={() => handleRemoveItem(item.id)} disabled={isLoading} className="btn btn-link text-danger p-0"><CloseIcon size={18}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                         {cart.items.length > 0 && (
                            <div className="mt-3 text-end">
                                <button
                                    onClick={() => {
                                        if (window.confirm(t('cart.confirmClearCart', 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?'))) {
                                            clearCart();
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="btn btn-sm btn-outline-danger text-uppercase small"
                                >
                                    {t('cart.clearCartButton', 'Xóa tất cả')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0 sticky-top" style={{top: 'calc(80px + 1rem)'}}> {/* Adjust top for sticky header */}
                            <div className="card-body p-3 p-md-4">
                                <h5 className="card-title text-uppercase small fw-bold mb-3">Tóm tắt đơn hàng</h5>
                                <div className="d-flex justify-content-between small mb-1">
                                    <p className="text-muted mb-0">{t('cart.subtotal', 'Tạm tính')} ({totalItems} {t('cart.items', 'sản phẩm')})</p>
                                    <p className="fw-medium text-dark mb-0">{formatPrice(subtotal)}</p>
                                </div>
                                {/* <div className="d-flex justify-content-between small text-muted mb-1"><p>Thuế</p><p>Đã bao gồm</p></div> */}
                                <div className="d-flex justify-content-between small text-muted mb-2">
                                    <p className="mb-0">{t('cart.shipping', 'Vận chuyển')}</p>
                                    <p className="mb-0">{t('cart.shippingCalculatedLater', 'Tính khi thanh toán')}</p>
                                </div>
                                <hr className="my-2"/>
                                <div className="d-flex justify-content-between fw-bold h6 mt-1 mb-3">
                                    <p className="mb-0">{t('cart.total', 'Tổng cộng')}</p>
                                    <p className="mb-0">{formatPrice(grandTotal)}</p>
                                </div>
                                <button onClick={handleCheckout} className="btn btn-dark w-100 text-uppercase py-2">
                                    {t('cart.proceedToCheckout', 'Tiến hành thanh toán')}
                                </button>
                                <p className="small text-muted text-center mt-2" style={{fontSize: '0.7rem'}}>
                                    Bằng cách tiếp tục, bạn đồng ý với <Link to="/terms" className="text-dark">Điều khoản</Link> & <Link to="/privacy" className="text-dark">Chính sách bảo mật</Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Footer is rendered by MainLayout */}
        </div>
    );
};

export default CartPage;
