// src/components/cart/CartSliderPanel.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Giữ lại useNavigate nếu bạn dùng nó trực tiếp trong component này
// import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'; // Hoặc dùng icon từ thư viện khác
import { XLg, Cart3, PlusLg, DashLg, Trash } from 'react-bootstrap-icons'; // Ví dụ dùng react-bootstrap-icons

// GSAP (đảm bảo đã import và đăng ký plugin ở file chính)
// import { gsap } from 'gsap'; // Nếu import trực tiếp
// Hoặc truy cập qua window.gsap nếu đã load global

import { formatPrice } from '../../utils/formatters';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Giả sử bạn có hằng số này
// OptimizedImage có thể không cần thiết ở đây nếu ảnh đã nhỏ hoặc bạn xử lý src trực tiếp
// import OptimizedImage from '../common/OptimizedImage';

const CartSliderPanel = ({
    isOpen,
    onClose,
    cartItems = [],
    onUpdateQuantity,
    onRemoveItem,
    onCheckout, // Hàm điều hướng đến trang checkout
    onViewCart, // Hàm điều hướng đến trang giỏ hàng đầy đủ
    // subtotal và totalItems sẽ được tính toán bên trong component này
}) => {
    const cartPanelRef = useRef(null);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.product_price || 0) * item.quantity, 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        if (!cartPanelRef.current || typeof window.gsap === 'undefined') return;
        const panel = cartPanelRef.current;

        if (isOpen) {
            // Khi mở, panel sẽ trượt vào từ bên phải
            document.body.style.overflow = 'hidden'; // Ngăn scroll body khi panel mở
            window.gsap.to(panel, { x: 0, duration: 0.35, ease: "power2.out" });
        } else {
            // Khi đóng, panel trượt ra
            document.body.style.overflow = ''; // Cho phép scroll body lại
            // Chỉ animate khi panel thực sự đã mở và đang được đóng
            if (panel.style.transform === 'translateX(0px)' || panel.style.transform === '') {
                 window.gsap.to(panel, { x: "100%", duration: 0.3, ease: "power2.in" });
            } else if (!isOpen && panel.style.transform === '') { // Trạng thái ẩn ban đầu
                 window.gsap.set(panel, { x: "100%" });
            }
        }
    }, [isOpen]);

    // Điều kiện render: chỉ render nếu isOpen là true hoặc panel đã từng được mở (để animation đóng chạy)
    // Hoặc đơn giản là luôn render và để GSAP xử lý visibility/transform
    // if (!isOpen && (!cartPanelRef.current || cartPanelRef.current.style.transform === 'translateX(100%)')) {
    //     return null;
    // }

    const handleItemImageError = (e) => {
        e.target.onerror = null;
        e.target.src = PRODUCT_IMAGE_PLACEHOLDER;
    };

    return (
        <>
            {/* Backdrop của Bootstrap Offcanvas */}
            {isOpen && <div className="offcanvas-backdrop fade show" onClick={onClose} style={{zIndex: 1040}}></div>}

            <div
                ref={cartPanelRef}
                className="offcanvas offcanvas-end bg-white text-dark shadow-lg" // Thêm text-dark cho chữ màu đen trên nền trắng
                tabIndex="-1"
                id="cartOffcanvas"
                aria-labelledby="cartOffcanvasLabel"
                style={{
                    transform: 'translateX(100%)', // Trạng thái ban đầu (ẩn bên phải)
                    visibility: 'hidden', // Ẩn ban đầu, GSAP sẽ làm nó visible
                    width: '360px', // Độ rộng của panel
                    zIndex: 1045 // z-index cao hơn backdrop
                }}
            >
                <div className="offcanvas-header border-bottom p-3">
                    <h5 className="offcanvas-title text-uppercase small fw-bold" id="cartOffcanvasLabel">
                        <Cart3 size={18} className="me-2"/>
                        Giỏ hàng của bạn
                    </h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>

                <div className="offcanvas-body p-0 d-flex flex-column">
                    {cartItems.length === 0 ? (
                        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                            <Cart3 size={48} className="text-muted mb-3"/>
                            <p className="text-muted mb-3">Giỏ hàng của bạn hiện đang trống.</p>
                            <button onClick={() => { onClose(); if(onViewCart) onViewCart('products'); /* Hoặc trang products */}} className="btn btn-dark btn-sm">
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    ) : (
                        <ul className="list-group list-group-flush flex-grow-1 overflow-auto" style={{fontSize: '0.875rem'}}> {/* small */}
                            {cartItems.map((item) => {
                                const product = item.product || {}; // Đảm bảo product tồn tại
                                const colorName = item.selectedColor?.name || '';
                                const sizeName = item.selectedSize?.name || '';
                                const itemImage = product.images?.[0]?.image_url || PRODUCT_IMAGE_PLACEHOLDER;

                                return (
                                    <li key={item.id || product.product_id} className="list-group-item px-3 py-3">
                                        <div className="d-flex align-items-start">
                                            <img
                                                src={itemImage}
                                                alt={`[Hình ảnh của ${product.name}]`}
                                                className="rounded border me-3"
                                                style={{width: '60px', height: '75px', objectFit: 'cover'}}
                                                onError={handleItemImageError}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <Link 
                                                        to={`/product/${product.slug || product.product_id}`} 
                                                        onClick={onClose} 
                                                        className="text-dark fw-medium text-decoration-none mb-1 d-block"
                                                        style={{fontSize: '0.8rem', lineHeight: 1.3}}
                                                    >
                                                        {product.name || "Tên sản phẩm"}
                                                    </Link>
                                                    <button 
                                                        type="button" 
                                                        className="btn-close btn-sm" 
                                                        style={{fontSize: '0.6rem'}}
                                                        onClick={() => onRemoveItem(item.id || product.product_id)}
                                                        aria-label="Remove item"
                                                    ></button>
                                                </div>
                                                {(colorName || sizeName) && (
                                                    <p className="mb-1 text-muted" style={{fontSize: '0.75rem'}}>
                                                        {colorName}{colorName && sizeName ? ' / ' : ''}{sizeName}
                                                    </p>
                                                )}
                                                <div className="d-flex justify-content-between align-items-center mt-1">
                                                    <span className="fw-bold text-dark" style={{fontSize: '0.8rem'}}>{formatPrice(product.product_price)}</span>
                                                    <div className="input-group input-group-sm border rounded" style={{width: '100px'}}>
                                                        <button 
                                                            className="btn btn-link text-dark px-2 py-1" 
                                                            type="button" 
                                                            onClick={() => onUpdateQuantity(item.id || product.product_id, item.quantity - 1)} 
                                                            disabled={item.quantity <= 1}
                                                            style={{lineHeight: 1}}
                                                        >
                                                            <DashLg size={12}/>
                                                        </button>
                                                        <input 
                                                            type="text" 
                                                            className="form-control text-center border-0 px-1 py-1 bg-transparent" 
                                                            value={item.quantity} 
                                                            readOnly 
                                                            style={{fontSize: '0.8rem', boxShadow: 'none'}}
                                                        />
                                                        <button 
                                                            className="btn btn-link text-dark px-2 py-1" 
                                                            type="button" 
                                                            onClick={() => onUpdateQuantity(item.id || product.product_id, item.quantity + 1)}
                                                            style={{lineHeight: 1}}
                                                        >
                                                            <PlusLg size={12}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {cartItems.length > 0 && (
                        <div className="offcanvas-footer p-3 border-top bg-light">
                            <div className="d-flex justify-content-between small mb-1">
                                <p className="text-muted mb-0">Tạm tính ({totalItems} sản phẩm)</p>
                                <p className="fw-bold text-dark mb-0">{formatPrice(subtotal)}</p>
                            </div>
                            {/* <div className="d-flex justify-content-between small text-muted mb-1"><p>Thuế</p><p>Đã bao gồm</p></div> */}
                            <div className="d-flex justify-content-between small text-muted mb-2">
                                <p className="mb-0">Vận chuyển</p>
                                <p className="mb-0">Tính khi thanh toán</p>
                            </div>
                            <hr className="my-2"/>
                            <div className="d-flex justify-content-between fw-bold h6 mt-1 mb-3">
                                <p className="mb-0">Tổng cộng</p>
                                <p className="mb-0">{formatPrice(subtotal)}</p>
                            </div>
                            <div className="d-grid gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => { onClose(); if(onViewCart) onViewCart('cart'); }} 
                                    className="btn btn-outline-dark text-uppercase btn-sm"
                                >
                                    Xem giỏ hàng
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { onClose(); if(onCheckout) onCheckout(); }} 
                                    className="btn btn-dark text-uppercase btn-sm"
                                >
                                    Thanh toán
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartSliderPanel;
