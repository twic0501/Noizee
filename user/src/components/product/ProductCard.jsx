// src/components/product/ProductCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } // Bỏ useNavigate vì component này không tự điều hướng
from 'react-router-dom';
// Sử dụng icon từ react-bootstrap-icons hoặc thư viện icon khác nếu muốn thay thế lucide-react
import { Cart as ShoppingCartIcon, ChevronDown as ChevronDownIcon } from 'react-bootstrap-icons'; // Ví dụ dùng react-bootstrap-icons
// import { ShoppingCart, ChevronDown } from 'lucide-react'; // Giữ lại nếu bạn vẫn muốn dùng lucide-react

// GSAP (nếu vẫn sử dụng, đảm bảo đã import và đăng ký plugin đúng cách ở file chính)
// import { gsap } from 'gsap';
// import { useGSAP } from '@gsap/react';

import OptimizedImage from '../common/OptimizedImage'; // Đường dẫn tới OptimizedImage của bạn
import { formatPrice } from '../../utils/formatters'; // Đường dẫn tới formatters của bạn
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Placeholder

// Helper function để lấy ảnh cho màu đã chọn
const getImagesForColor = (allImages, colorId) => {
    if (!allImages || allImages.length === 0) {
        return { main: PRODUCT_IMAGE_PLACEHOLDER, hover: null };
    }
    const colorImages = allImages.filter(img => img.color?.color_id === colorId && img.image_url);
    const mainImage = colorImages.find(img => img.display_order === 0) || colorImages[0];
    const hoverImage = colorImages.find(img => img.display_order === 1);
    return {
        main: mainImage?.image_url || PRODUCT_IMAGE_PLACEHOLDER,
        hover: hoverImage?.image_url,
    };
};

// Helper function để lấy ảnh mặc định
const getDefaultImages = (allImages) => {
    if (!allImages || allImages.length === 0) {
        return { main: PRODUCT_IMAGE_PLACEHOLDER, hover: null };
    }
    const mainImage = allImages.find(img => img.display_order === 0 && !img.color) || allImages.find(img => !img.color) || allImages[0];
    const hoverImage = allImages.find(img => img.display_order === 1 && !img.color);
     return {
        main: mainImage?.image_url || PRODUCT_IMAGE_PLACEHOLDER,
        hover: hoverImage?.image_url,
    };
}

const ProductCard = ({ product, className, onAddToCart, onNavigateToDetail }) => {
    // onAddToCart và onNavigateToDetail được truyền từ props thay vì dùng useCart và useNavigate trực tiếp
    // Điều này làm component linh hoạt hơn và dễ test hơn.

    const availableColorsFromInventory = product.inventory
        ? [...new Map(product.inventory.filter(inv => inv.color).map(inv => [inv.color.color_id, inv.color])).values()]
        : [];

    const [selectedColorId, setSelectedColorId] = useState(
        product.defaultColorId || availableColorsFromInventory[0]?.color_id || null
    );

    const availableSizesForSelectedColor = product.inventory
        ? [...new Map(product.inventory
            .filter(inv => inv.color?.color_id === selectedColorId && inv.size && inv.quantity > 0)
            .map(inv => [inv.size.size_id, inv.size]))
            .values()]
        : [];

    const [selectedSizeId, setSelectedSizeId] = useState(
        product.defaultSizeId || availableSizesForSelectedColor[0]?.size_id || null
    );

    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const [showSizeSelector, setShowSizeSelector] = useState(false);

    const sizeSelectorRef = useRef(null);
    const cardRef = useRef(null); // Cho GSAP nếu dùng

    // GSAP animation (nếu dùng)
    // useGSAP(() => {
    //     if (cardRef.current && isHoveringImage) {
    //         gsap.to(cardRef.current.querySelector('.product-card-img-wrapper img'), { // Target ảnh cụ thể hơn
    //             scale: 1.07,
    //             duration: 0.3,
    //             ease: 'power2.out',
    //         });
    //     } else if (cardRef.current) {
    //         gsap.to(cardRef.current.querySelector('.product-card-img-wrapper img'), {
    //             scale: 1,
    //             duration: 0.3,
    //             ease: 'power2.out',
    //         });
    //     }
    // }, { dependencies: [isHoveringImage], scope: cardRef });


    useEffect(() => {
        const newAvailableSizes = product.inventory
            ? [...new Map(product.inventory
                .filter(inv => inv.color?.color_id === selectedColorId && inv.size && inv.quantity > 0)
                .map(inv => [inv.size.size_id, inv.size]))
                .values()]
            : [];
        setSelectedSizeId(newAvailableSizes[0]?.size_id || null);
    }, [selectedColorId, product.inventory]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sizeSelectorRef.current && !sizeSelectorRef.current.contains(event.target)) {
                setShowSizeSelector(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sizeSelectorRef]);

    const currentImages = selectedColorId && product.images
        ? getImagesForColor(product.images, selectedColorId)
        : getDefaultImages(product.images || []);

    const displayImage = isHoveringImage && currentImages.hover ? currentImages.hover : currentImages.main;

    const handleColorSwatchClick = (colorId, e) => {
        e.stopPropagation();
        setSelectedColorId(colorId);
    };

    const handleSizeSelect = (sizeId, e) => {
        e.stopPropagation();
        setSelectedSizeId(sizeId);
        setShowSizeSelector(false);
    };

    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        if (availableSizesForSelectedColor.length > 0 && !selectedSizeId) {
            setShowSizeSelector(true);
            // Cân nhắc thêm alert hoặc toast message cho người dùng
            console.warn("Vui lòng chọn kích thước sản phẩm:", product.name);
            return;
        }
        if (availableColorsFromInventory.length > 0 && !selectedColorId) {
            console.warn("Vui lòng xác nhận màu sắc sản phẩm:", product.name);
            return;
        }

        const inventoryItem = product.inventory?.find(
            inv => inv.color?.color_id === selectedColorId && inv.size?.size_id === selectedSizeId
        ) || product.inventory?.find( // Fallback cho sản phẩm không có màu nhưng có size
            inv => !inv.color && inv.size?.size_id === selectedSizeId
        ) || product.inventory?.find( // Fallback cho sản phẩm chỉ có màu, không có size
            inv => inv.color?.color_id === selectedColorId && !inv.size
        ) || product.inventory?.find( // Fallback cho sản phẩm không có màu và không có size
            inv => !inv.color && !inv.size && inv.quantity > 0
        );


        if (!inventoryItem || inventoryItem.quantity < 1) {
            alert("Sản phẩm với lựa chọn này hiện đã hết hàng."); // Sử dụng modal/toast thay alert
            return;
        }

        if (onAddToCart) {
            onAddToCart(product, selectedColorId, selectedSizeId, inventoryItem.inventory_id);
        }
    };
    
    const productLink = `/product/${product.slug || product.product_id}`;

    return (
        <div ref={cardRef} className={`card h-100 product-card border-0 rounded-0 shadow-sm hover-shadow-lg ${className || ''}`}>
            {/* Thẻ Link bao bọc hình ảnh */}
            <div
                className="product-card-img-wrapper position-relative w-100 overflow-hidden"
                style={{ paddingBottom: '125%', backgroundColor: '#f8f9fa', cursor: 'pointer' }} // 4:5 aspect ratio
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
                onClick={() => { if (onNavigateToDetail) onNavigateToDetail(product.product_id || product.slug); }}
            >
                <OptimizedImage
                    src={displayImage} // displayImage đã bao gồm API_BASE_URL nếu cần
                    alt={`[Hình ảnh của ${product.name}]`}
                    containerClassName="position-absolute top-0 start-0 w-100 h-100"
                    imageClassName="card-img-top rounded-0" // card-img-top có thể không cần nếu container đã xử lý
                    objectFitClass="object-fit-cover" // Bootstrap class
                    placeholderSrcOverride={PRODUCT_IMAGE_PLACEHOLDER}
                />
            </div>
            <div className="card-body p-2 p-sm-3 d-flex flex-column small">
                <h6 className="card-title mb-1 text-truncate-2-lines small">
                    <Link 
                        to={productLink} 
                        className="text-dark text-decoration-none stretched-link-product-name"
                        onClick={(e) => {
                            // Ngăn chặn lan truyền sự kiện click lên card-body nếu link được click trực tiếp
                            // Tuy nhiên, stretched-link đã làm cho toàn bộ card có thể click được
                            // e.stopPropagation(); // Có thể không cần thiết nếu hành vi click đã đúng ý
                            if (onNavigateToDetail) onNavigateToDetail(product.product_id || product.slug);
                        }}
                    >
                        {product.name || "Tên sản phẩm không xác định"}
                    </Link>
                </h6>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="fw-bold text-dark mb-0 small">
                        {formatPrice(product.product_price, 'VND')}
                    </p>
                    {availableColorsFromInventory.length > 0 && (
                        <div className="d-flex align-items-center">
                            {availableColorsFromInventory.slice(0, 3).map(color => (
                                <button
                                    key={color.color_id}
                                    type="button"
                                    onClick={(e) => handleColorSwatchClick(color.color_id, e)}
                                    className={`btn btn-sm rounded-circle p-0 ms-1 border ${selectedColorId === color.color_id ? 'border-dark ring-1 ring-dark' : 'border-light'}`}
                                    style={{ width: '16px', height: '16px', backgroundColor: color.color_hex, lineHeight: '16px' }}
                                    title={color.name}
                                    aria-label={`Chọn màu ${color.name}`}
                                />
                            ))}
                             {availableColorsFromInventory.length > 3 && (
                                <Link 
                                    to={productLink} 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn navigate của card
                                        if (onNavigateToDetail) onNavigateToDetail(product.product_id || product.slug);
                                    }} 
                                    className="text-muted small lh-1 align-self-center ms-1 text-decoration-none" 
                                    title="Xem thêm màu"
                                    style={{fontSize: '0.7rem'}}
                                >
                                    +{availableColorsFromInventory.length - 3}
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-auto d-flex align-items-center border-top pt-2">
                    <div className="dropdown flex-grow-1 me-2" ref={sizeSelectorRef}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowSizeSelector(!showSizeSelector); }}
                            className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-between align-items-center py-1 px-2"
                            disabled={availableSizesForSelectedColor.length === 0}
                            style={{fontSize: '0.7rem'}}
                        >
                            <span>{availableSizesForSelectedColor.find(s => s.size_id === selectedSizeId)?.size_name || (availableSizesForSelectedColor.length > 0 ? 'Cỡ' : 'Hết cỡ')}</span>
                            <ChevronDownIcon size={12} />
                        </button>
                        {showSizeSelector && availableSizesForSelectedColor.length > 0 && (
                            <ul className="dropdown-menu show position-absolute w-100" style={{fontSize: '0.7rem', maxHeight: '100px', overflowY: 'auto', zIndex: 10}}>
                                {availableSizesForSelectedColor.map(size => (
                                    <li key={size.size_id}>
                                        <button 
                                            className={`dropdown-item py-1 px-2 ${selectedSizeId === size.size_id ? 'active bg-dark text-white' : ''}`} 
                                            onClick={(e) => handleSizeSelect(size.size_id, e)}
                                        >
                                            {size.size_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddToCartClick}
                        className="btn btn-dark btn-sm p-1 lh-1"
                        aria-label="Thêm vào giỏ hàng"
                        disabled={
                            (availableSizesForSelectedColor.length > 0 && !selectedSizeId) || 
                            (availableColorsFromInventory.length > 0 && !selectedColorId)
                        }
                    >
                        <ShoppingCartIcon size={16} />
                    </button>
                </div>
            </div>
            {/* CSS nội bộ cho card, có thể chuyển ra file CSS riêng */}
            <style jsx global>{`
                .product-card .text-truncate-2-lines {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.4; /* Điều chỉnh nếu cần */
                    min-height: calc(1.4em * 2); /* line-height * số dòng */
                }
                .stretched-link-product-name::after {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 1; /* Đảm bảo link bao phủ */
                    content: "";
                }
                .product-card-img-wrapper {
                    transition: transform 0.3s ease-out;
                }
                .product-card:hover .product-card-img-wrapper {
                     transform: scale(1.02); /* Hiệu ứng zoom nhẹ khi hover card */
                }
                .hover-shadow-lg:hover {
                     box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .dropdown-menu.show { /* Đảm bảo dropdown hiển thị */
                    display: block;
                 }
            `}</style>
        </div>
    );
};

export default ProductCard;
