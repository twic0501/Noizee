// src/components/cart/CartSliderPanel.jsx
import React from 'react';
import { Offcanvas, Button, Image, ListGroup, Badge, CloseButton as BootstrapCloseButton } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FiX, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import { formatPrice } from '../../utils/formatters';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';
// import logger from '../../utils/logger';

const CartSliderPanel = ({
    isOpen,
    onClose,
    cartItems = [], // Mong đợi [{ product, quantity, selectedColor, selectedSize, totalPriceForItem }, ...]
                    // product nên chứa: id, name, images, price
                    // selectedColor nên chứa: name
                    // selectedSize nên chứa: name
    onUpdateQuantity, // (itemId, newQuantity) => void
    onRemoveItem,     // (itemId) => void
    // onCheckout,    // Sẽ dùng navigate trực tiếp
    // onViewCart,    // Sẽ dùng navigate trực tiếp
    subtotal = 0,
    totalItems = 0,
    cartLoading = false // Thêm prop này để biết khi nào giỏ hàng đang được cập nhật
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose(); // Đóng panel trước khi điều hướng
        navigate('/checkout');
    };

    const handleViewCart = () => {
        onClose(); // Đóng panel trước khi điều hướng
        navigate('/cart');
    };

    const getItemImage = (item) => {
        if (item.product?.images && item.product.images.length > 0) {
            // Ưu tiên ảnh của màu đã chọn, hoặc ảnh chung đầu tiên
            const colorImage = item.selectedColorId && item.product.images.find(
                img => img.color?.color_id === item.selectedColorId && img.display_order === 0
            );
            if (colorImage) return `${API_BASE_URL}${colorImage.image_url}`;

            const generalImage = item.product.images.find(img => !img.color && img.display_order === 0);
            if (generalImage) return `${API_BASE_URL}${generalImage.image_url}`;

            return `${API_BASE_URL}${item.product.images[0].image_url}`; // Ảnh đầu tiên bất kỳ
        }
        return PRODUCT_IMAGE_PLACEHOLDER;
    };


    return (
        <Offcanvas show={isOpen} onHide={onClose} placement="end" className="cart-slider-panel bg-white text-dark shadow-lg">
            <Offcanvas.Header className="border-bottom p-3 cart-slider-header">
                <Offcanvas.Title as="h5" className="text-uppercase small fw-bold d-flex align-items-center">
                    <FiShoppingCart size={18} className="me-2"/>
                    {t('cart.panelTitle', 'Giỏ hàng của bạn')}
                </Offcanvas.Title>
                <BootstrapCloseButton onClick={onClose} aria-label="Close" />
            </Offcanvas.Header>

            <Offcanvas.Body className="p-0 d-flex flex-column">
                {cartLoading && cartItems.length === 0 && (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                        <p className="text-muted small">{t('cart.loadingCart', 'Đang tải giỏ hàng...')}</p>
                    </div>
                )}
                {!cartLoading && cartItems.length === 0 ? (
                    <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                        <FiShoppingCart size={48} className="text-muted mb-3"/>
                        <p className="text-muted mb-3">{t('cart.emptyPanelPrompt', 'Giỏ hàng của bạn hiện đang trống.')}</p>
                        <Button variant="dark" size="sm" onClick={() => { onClose(); navigate('/products'); }}>
                            {t('cart.continueShoppingButton')}
                        </Button>
                    </div>
                ) : (
                    <ListGroup variant="flush" className="flex-grow-1 overflow-auto custom-scrollbar-light cart-items-list">
                        {cartItems.map((item) => {
                            // Tạo một ID duy nhất cho item dựa trên product, color, size nếu item.id không có sẵn
                            const itemId = item.id || `${item.product.product_id}-${item.selectedColorId || 'none'}-${item.selectedSizeId || 'none'}`;
                            const itemImage = getItemImage(item);
                            const productName = item.product?.name || t('cart.unknownProduct', 'Sản phẩm không xác định');
                            const colorName = item.selectedColor?.name || '';
                            const sizeName = item.selectedSize?.name || '';
                            const itemPrice = item.product?.product_price || 0;

                            return (
                                <ListGroup.Item key={itemId} className="px-3 py-3 cart-slider-item">
                                    <div className="d-flex align-items-start">
                                        <Image
                                            src={itemImage}
                                            alt={productName}
                                            className="cart-item-image me-3 border rounded"
                                            onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_IMAGE_PLACEHOLDER; }}
                                        />
                                        <div className="flex-grow-1">
                                            <Link to={`/product/${item.product.product_id}`} onClick={onClose} className="cart-item-name text-dark fw-medium text-decoration-none small d-block mb-1">
                                                {productName}
                                            </Link>
                                            {(colorName || sizeName) && (
                                                <p className="text-muted extra-small mb-1">
                                                    {colorName}{colorName && sizeName ? ' / ' : ''}{sizeName}
                                                </p>
                                            )}
                                            <div className="d-flex align-items-center justify-content-between mt-1">
                                                <div className="quantity-selector-sm d-flex align-items-center border rounded">
                                                    <Button variant="link" size="sm" className="text-dark p-1" onClick={() => onUpdateQuantity(itemId, item.quantity - 1)} disabled={item.quantity <= 1 || cartLoading}>
                                                        <FiMinus size={12}/>
                                                    </Button>
                                                    <span className="px-2 small text-dark">{item.quantity}</span>
                                                    <Button variant="link" size="sm" className="text-dark p-1" onClick={() => onUpdateQuantity(itemId, item.quantity + 1)} disabled={cartLoading}>
                                                        <FiPlus size={12}/>
                                                    </Button>
                                                </div>
                                                <span className="text-dark small fw-medium">{formatPrice(itemPrice * item.quantity)}</span>
                                            </div>
                                        </div>
                                        <Button variant="link" className="text-muted hover-danger p-0 ms-2" onClick={() => onRemoveItem(itemId)} disabled={cartLoading} aria-label="Remove item">
                                            <FiTrash2 size={14}/>
                                        </Button>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}

                {cartItems.length > 0 && (
                    <div className="cart-slider-footer p-3 border-top bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-dark small fw-medium">{t('cart.subtotal', 'Tạm tính')} ({totalItems} {t('cart.items', 'sản phẩm')})</span>
                            <span className="text-dark fw-bold">{formatPrice(subtotal)}</span>
                        </div>
                        <p className="text-muted extra-small mb-3">{t('cart.shippingTaxesCalculated', 'Phí vận chuyển và thuế sẽ được tính khi thanh toán.')}</p>
                        <div className="d-grid gap-2">
                            <Button variant="outline-dark" size="sm" onClick={handleViewCart} className="text-uppercase small">
                                {t('cart.viewCartButton', 'Xem giỏ hàng')}
                            </Button>
                            <Button variant="dark" size="sm" onClick={handleCheckout} className="text-uppercase small">
                                {t('cart.proceedToCheckout', 'Tiến hành thanh toán')}
                            </Button>
                        </div>
                    </div>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

CartSliderPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    cartItems: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string, // ID của cart item (nếu có từ backend)
        product: PropTypes.shape({
            product_id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            product_price: PropTypes.number.isRequired,
            images: PropTypes.arrayOf(PropTypes.shape({
                image_url: PropTypes.string,
                display_order: PropTypes.number,
                color: PropTypes.shape({ color_id: PropTypes.string })
            }))
        }).isRequired,
        quantity: PropTypes.number.isRequired,
        selectedColorId: PropTypes.string,
        selectedSizeId: PropTypes.string,
        selectedColor: PropTypes.shape({ name: PropTypes.string }), // Object màu đã chọn
        selectedSize: PropTypes.shape({ name: PropTypes.string }),   // Object size đã chọn
        // totalPriceForItem: PropTypes.number.isRequired, // Có thể tính toán lại
    })),
    onUpdateQuantity: PropTypes.func.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
    subtotal: PropTypes.number,
    totalItems: PropTypes.number,
    cartLoading: PropTypes.bool,
};

export default CartSliderPanel;
