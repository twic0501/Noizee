// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
    ShoppingCart, Minus, Plus, CheckCircle, ChevronDown, ChevronUp, ArrowLeft,
    Maximize, Heart, Share2
} from 'lucide-react'; // Sử dụng lucide-react như trong thiết kế mới
import DOMPurify from 'dompurify';

import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/productQueries';
import { useCart } from '../contexts/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import OptimizedImage from '../components/common/OptimizedImage';
import { formatPrice } from '../utils/formatters';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/constants';
// import logger from '../utils/logger'; // Bỏ comment nếu bạn dùng logger

// --- Accordion Item Component (Sử dụng Bootstrap classes) ---
const DetailAccordionItem = ({ title, htmlContent, defaultOpen = false, eventKey }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    if (!htmlContent) return null;
    const cleanContent = DOMPurify.sanitize(htmlContent);

    // Sử dụng ID duy nhất cho collapse element
    const collapseId = `collapse-${eventKey.replace(/\s+/g, '-')}`;

    return (
        <div className="accordion-item border-bottom">
            <h2 className="accordion-header" id={`heading-${eventKey}`}>
                <button
                    className={`accordion-button small fw-medium text-dark shadow-none ${isOpen ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-controls={collapseId}
                    style={{ backgroundColor: 'transparent', padding: '0.75rem 0' }} // Tùy chỉnh padding
                >
                    {title}
                </button>
            </h2>
            <div
                id={collapseId}
                className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}
                aria-labelledby={`heading-${eventKey}`}
            >
                <div className="accordion-body small text-muted pt-0 pb-3 px-0" // Tùy chỉnh padding
                     dangerouslySetInnerHTML={{ __html: cleanContent }} />
            </div>
        </div>
    );
};


const ProductDetailPage = () => {
    const { t, i18n } = useTranslation();
    const { productSlug } = useParams();
    const navigate = useNavigate();
    const { addToCart, isLoading: cartLoadingContext, cartError, clearCartError } = useCart();
    const currentLang = i18n.language || 'vi';

    const [selectedColorId, setSelectedColorId] = useState(null);
    const [selectedSizeId, setSelectedSizeId] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addToCartFeedback, setAddToCartFeedback] = useState({ error: null, success: null, loading: false });
    const [activeMainImage, setActiveMainImage] = useState(''); // Sẽ là URL đầy đủ
    const [galleryThumbnails, setGalleryThumbnails] = useState([]);

    const { data, loading: queryLoading, error: queryError } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
        variables: { id: productSlug, lang: currentLang }, // Giả sử query dùng 'id' cho slug/id sản phẩm
        fetchPolicy: 'cache-and-network',
        onCompleted: (queryData) => {
            if (queryData?.product) {
                const productData = queryData.product;
                const initialAvailableColors = productData.inventory
                    ?.filter(inv => inv.color && inv.color.color_id && inv.quantity > 0)
                    .map(inv => inv.color)
                    .filter((color, index, self) => index === self.findIndex(c => c.color_id === color.color_id)) || [];

                let initialColorIdToSet = null;
                if (initialAvailableColors.length > 0) {
                    const defaultColorFromImage = productData.images?.find(img => img.display_order === 0 && img.color)?.color;
                    const initialColor = defaultColorFromImage && initialAvailableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                        ? initialAvailableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                        : initialAvailableColors[0];
                    if (initialColor) initialColorIdToSet = initialColor.color_id;
                }
                setSelectedColorId(initialColorIdToSet);
            }
        }
    });

    const product = data?.product;

    const availableColors = useMemo(() => {
        if (!product?.inventory) return [];
        const colorsMap = new Map();
        product.inventory.forEach(inv => {
            if (inv.color && inv.color.color_id && inv.quantity > 0) {
                 if (!colorsMap.has(inv.color.color_id)) {
                    // Trường 'name' trong 'inv.color' đã được resolver xử lý đa ngôn ngữ
                    colorsMap.set(inv.color.color_id, { ...inv.color });
                }
            }
        });
        return Array.from(colorsMap.values());
    }, [product, currentLang]);

    const availableSizes = useMemo(() => {
        if (!product?.inventory || !selectedColorId) return [];
        const sizesMap = new Map();
        product.inventory.forEach(inv => {
            if (inv.color?.color_id === selectedColorId && inv.size && inv.size.size_id) {
                // Giả sử size_name không đa ngôn ngữ trực tiếp, hoặc đã được xử lý
                sizesMap.set(inv.size.size_id, { ...inv.size, available: inv.quantity > 0 });
            }
        });
        // Sắp xếp size (ví dụ: S, M, L) - cần logic sắp xếp phù hợp nếu tên size không tự nhiên sắp xếp đúng
        return Array.from(sizesMap.values()).sort((a,b) => (a.size_name || "").localeCompare(b.size_name || ""));
    }, [product, selectedColorId]);

    useEffect(() => {
        if (availableSizes.length > 0) {
            const firstAvailableSize = availableSizes.find(s => s.available);
            setSelectedSizeId(firstAvailableSize ? firstAvailableSize.size_id : null);
        } else {
            setSelectedSizeId(null); // Không có size nào cho màu đã chọn
        }
        setQuantity(1);
        setAddToCartFeedback({ error: null, success: null, loading: false });
    }, [selectedColorId, availableSizes]); // Phụ thuộc vào availableSizes để cập nhật khi nó thay đổi

    const getFullImageUrl = (relativePath) => {
        if (!relativePath) return PRODUCT_IMAGE_PLACEHOLDER;
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
            return relativePath;
        }
        return `${API_BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    };

    useEffect(() => {
        if (!product || !product.images) {
            setActiveMainImage(PRODUCT_IMAGE_PLACEHOLDER);
            setGalleryThumbnails([]);
            return;
        }
        let imagesToDisplay = product.images.filter(img => selectedColorId && img.color?.color_id === selectedColorId);
        if (imagesToDisplay.length === 0) imagesToDisplay = product.images.filter(img => !img.color);
        if (imagesToDisplay.length === 0) imagesToDisplay = product.images;

        const sortedImages = [...imagesToDisplay].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

        if (sortedImages.length > 0) {
            setActiveMainImage(getFullImageUrl(sortedImages[0].image_url));
            setGalleryThumbnails(sortedImages.map(img => ({
                src: getFullImageUrl(img.image_url),
                alt: img.alt_text || product.name || `Thumbnail ${img.image_id}`
            })));
        } else {
            setActiveMainImage(PRODUCT_IMAGE_PLACEHOLDER);
            setGalleryThumbnails([]);
        }
    }, [product, selectedColorId, currentLang]);


    const handleColorSelect = useCallback((color) => setSelectedColorId(color.color_id), []);
    const handleSizeSelect = useCallback((size) => setSelectedSizeId(size.size_id), []);

    const currentInventoryItem = useMemo(() => {
        if (!product?.inventory) return null;
        if (availableColors.length > 0 && !selectedColorId) return null; // Phải chọn màu nếu có màu
        if (availableSizes.length > 0 && !selectedSizeId) return null; // Phải chọn size nếu có size cho màu đó

        return product.inventory.find(inv =>
            (availableColors.length === 0 || inv.color?.color_id === selectedColorId) &&
            (availableSizes.length === 0 || inv.size?.size_id === selectedSizeId)
        );
    }, [product, selectedColorId, selectedSizeId, availableColors, availableSizes]);

    const stockForSelection = currentInventoryItem?.quantity || 0;
    const isSelectionOutOfStock = stockForSelection <= 0 && (
        (availableColors.length > 0 && selectedColorId) &&
        (availableSizes.length === 0 || (availableSizes.length > 0 && selectedSizeId))
    );

    const handleQuantityChange = (amount) => {
        setQuantity((prev) => {
            const newQuantity = prev + amount;
            if (newQuantity >= 1 && newQuantity <= stockForSelection) return newQuantity;
            if (newQuantity < 1) return 1;
            if (newQuantity > stockForSelection && stockForSelection > 0) return stockForSelection;
            if (stockForSelection === 0 && quantity !== 1) return 1;
            return prev;
        });
    };

    const handleAddToCartClick = useCallback(async () => {
        if (cartLoadingContext) return;
        clearCartError();
        setAddToCartFeedback({ error: null, success: null, loading: true });

        if (!product) { setAddToCartFeedback({ error: t('common.errorOccurred'), success: null, loading: false }); return; }
        if (availableColors.length > 0 && !selectedColorId) { setAddToCartFeedback({ error: t('productDetail.selectColorPrompt'), success: null, loading: false }); return; }
        if (availableSizes.length > 0 && !selectedSizeId) {
            // Kích hoạt modal Bootstrap
            const modalElement = document.getElementById('sizeAlertModal');
            if (modalElement && window.bootstrap && window.bootstrap.Modal) {
                const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
                if(document.getElementById('sizeAlertModalBody')) {
                     document.getElementById('sizeAlertModalBody').innerText = t('productDetail.selectSizePrompt');
                }
                modal.show();
            } else {
                console.error("Modal #sizeAlertModal not found or Bootstrap not loaded.");
                alert(t('productDetail.selectSizePrompt')); // Fallback alert
            }
            setAddToCartFeedback({ error: t('productDetail.selectSizePrompt'), success: null, loading: false });
            return;
        }
        if (!currentInventoryItem || stockForSelection <= 0) { setAddToCartFeedback({ error: t('productDetail.outOfStock'), success: null, loading: false }); return; }
        if (quantity <= 0) { setAddToCartFeedback({ error: "Số lượng phải lớn hơn 0.", success: null, loading: false }); return; } // Cần key dịch
        if (quantity > stockForSelection) { setAddToCartFeedback({ error: "Không đủ hàng tồn kho.", success: null, loading: false }); return; } // Cần key dịch

        const itemToAdd = {
            productId: product.product_id,
            quantity: quantity,
            productVariantId: currentInventoryItem.inventory_id // inventory_id là ID của biến thể cụ thể
        };
        try {
            await addToCart(itemToAdd); // addToCart từ CartContext
            setAddToCartFeedback({ error: null, success: t('productDetail.addedToCartSuccess'), loading: false });
            setTimeout(() => setAddToCartFeedback({ error: null, success: null, loading: false }), 3000);
        } catch (err) {
            // cartError từ context đã được set bởi addToCart
            setAddToCartFeedback({ error: cartError?.message || t('common.errorOccurred'), success: null, loading: false });
        }
    }, [product, selectedColorId, selectedSizeId, quantity, addToCart, t, cartError, clearCartError, availableColors.length, availableSizes.length, currentInventoryItem, stockForSelection, cartLoadingContext]);


    if (queryLoading && !data) return <div className="container d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
    if (queryError) return <div className="container my-4"><AlertMessage type="error" title={t('productDetail.errorLoadingTitle')} message={queryError.message} /></div>;
    if (!product) return <div className="container my-4"><AlertMessage type="info" message={t('productDetail.notFound')} /></div>;

    const displayProductName = product.name;
    const displayDescription = product.description;

    return (
        <div className="bg-white text-dark"> {/* Nền trắng, chữ đen */}
             {/* Modal for size selection alert - Placed here for simplicity, ideally in App.js or global layout */}
            <div className="modal fade" id="sizeAlertModal" tabIndex="-1" aria-labelledby="sizeAlertModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="sizeAlertModalLabel">Thông báo</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body" id="sizeAlertModalBody">
                        {/* Content will be set by JS */}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
                    </div>
                    </div>
                </div>
            </div>

            <main className="container py-4 py-md-5">
                <button onClick={() => navigate(-1)} className="btn btn-link text-dark text-decoration-none ps-0 mb-4 small d-flex align-items-center">
                    <ArrowLeft size={16} className="me-1" /> {t('productDetail.backToListing', 'Trở về danh sách')}
                </button>

                <div className="row g-4 g-lg-5">
                    {/* Image Gallery Column */}
                    <div className="col-lg-7 d-flex flex-column-reverse flex-lg-row gap-3">
                        <div className="d-flex flex-lg-column gap-2 overflow-auto pb-2 pb-lg-0" style={{maxHeight: 'lg', flexShrink: 0}}>
                            {galleryThumbnails.map((thumb, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveMainImage(thumb.src)}
                                    className={`btn border p-0 overflow-hidden ${activeMainImage === thumb.src ? 'border-dark border-2' : 'border-light'}`}
                                    style={{width: '80px', height: '100px'}} // Kích thước thumbnail
                                >
                                    <OptimizedImage src={thumb.src} alt={thumb.alt} containerClassName="w-100 h-100" objectFitClass="object-fit-cover" />
                                </button>
                            ))}
                        </div>
                        <div className="flex-grow-1 position-relative bg-light border rounded-1 overflow-hidden" style={{aspectRatio: '4 / 5'}}>
                            <OptimizedImage src={activeMainImage} alt={displayProductName} containerClassName="w-100 h-100" objectFitClass="object-fit-cover" />
                            {/* <button className="btn btn-light btn-sm position-absolute top-0 end-0 m-2 opacity-75"><Maximize size={18}/></button> */}
                        </div>
                    </div>

                    {/* Product Info Column */}
                    <div className="col-lg-5">
                        <p className="text-uppercase text-muted small mb-1">
                            {product.category?.name || t('product.uncategorized', "Chưa phân loại")}
                        </p>
                        <h1 className="h3 fw-bold mb-2">{displayProductName}</h1>
                        {product.is_new_arrival && (
                             <span className="badge bg-dark text-white small fw-semibold text-uppercase me-2 mb-2">Mới</span>
                        )}
                        {isSelectionOutOfStock && (
                            <span className="badge bg-danger text-white small fw-semibold text-uppercase mb-2">{t('productDetail.outOfStock')}</span>
                        )}
                        <p className="h4 fw-medium text-dark mb-3">{formatPrice(product.product_price)}</p>

                        {availableColors.length > 0 && (
                            <div className="mb-4">
                                <label className="form-label small fw-medium text-uppercase">Màu sắc: <span className="text-dark text-capitalize">{availableColors.find(c => c.color_id === selectedColorId)?.name}</span></label>
                                <div className="d-flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color.color_id}
                                            onClick={() => handleColorSelect(color)}
                                            className={`btn rounded-circle border-2 p-0 ${selectedColorId === color.color_id ? 'border-dark shadow-sm ring-2 ring-dark ring-offset-1' : 'border-light hover-border-secondary'}`}
                                            style={{width: '32px', height: '32px', backgroundColor: color.color_hex}}
                                            title={color.name}
                                            aria-label={`Chọn màu ${color.name}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableSizes.length > 0 && (
                             <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                     <label className="form-label small fw-medium text-uppercase">Kích thước: <span className="text-dark">{availableSizes.find(s => s.size_id === selectedSizeId)?.size_name}</span></label>
                                    {/* <a href="#" className="small text-dark text-decoration-none">Hướng dẫn chọn cỡ</a> */}
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size.size_id}
                                            onClick={() => handleSizeSelect(size)}
                                            disabled={!size.available}
                                            className={`btn btn-sm ${selectedSizeId === size.size_id ? 'btn-dark' : 'btn-outline-secondary'} ${!size.available ? 'disabled opacity-50 text-decoration-line-through' : ''}`}
                                        >
                                            {size.size_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                         {isSelectionOutOfStock && !queryLoading && ( // Hiển thị rõ hơn nếu hết hàng cho lựa chọn cụ thể
                             <p className="text-danger small mb-3">{t('productDetail.outOfStock')}</p>
                        )}


                        <div className="mb-4">
                            <label htmlFor="quantityDetail" className="form-label small fw-medium text-uppercase">Số lượng</label>
                            <div className="input-group" style={{maxWidth: '130px'}}>
                                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isSelectionOutOfStock} className="btn btn-outline-secondary"><Minus size={16}/></button>
                                <input
                                    type="text" // Để tránh mũi tên của input number
                                    id="quantityDetail"
                                    name="quantity"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) {
                                            if (val >=1 && val <= stockForSelection) setQuantity(val);
                                            else if (val < 1) setQuantity(1);
                                            else if (val > stockForSelection && stockForSelection > 0) setQuantity(stockForSelection);
                                        } else if (e.target.value === '') {
                                            setQuantity(1); // Hoặc giữ nguyên, tùy logic
                                        }
                                    }}
                                    readOnly={isSelectionOutOfStock && stockForSelection === 0}
                                    className="form-control text-center small"
                                    style={{boxShadow: 'none'}} // Loại bỏ shadow khi focus
                                />
                                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= stockForSelection || isSelectionOutOfStock} className="btn btn-outline-secondary"><Plus size={16}/></button>
                            </div>
                             {stockForSelection > 0 && stockForSelection < 10 && !isSelectionOutOfStock && (
                                <p className="text-danger small mt-1">{t('productDetail.lowStock', 'Chỉ còn {{count}} sản phẩm!', { count: stockForSelection })}</p>
                            )}
                        </div>

                        <div className="d-grid gap-2 mb-3">
                             <button
                                onClick={handleAddToCartClick}
                                disabled={cartLoadingContext || addToCartFeedback.loading || isSelectionOutOfStock || (availableSizes.length > 0 && !selectedSizeId) || quantity <=0}
                                className="btn btn-dark btn-lg text-uppercase d-flex align-items-center justify-content-center"
                            >
                                {addToCartFeedback.loading || cartLoadingContext ? (
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                ) : (
                                    <ShoppingCart size={18} className="me-2"/>
                                )}
                                {isSelectionOutOfStock ? t('productDetail.outOfStock') : t('productDetail.addToCartButton')}
                            </button>
                            {/* <button className="btn btn-secondary btn-lg text-uppercase">Mua với Express Pay</button> */}
                        </div>
                        <div className="mb-4" style={{minHeight: '20px'}}> {/* Fixed height for feedback area */}
                            {addToCartFeedback.success && (
                                <div className="text-success small d-flex align-items-center">
                                    <CheckCircle size={14} className="me-1"/>{addToCartFeedback.success}
                                </div>
                            )}
                            {addToCartFeedback.error && (
                                <div className="text-danger small">
                                    {addToCartFeedback.error}
                                </div>
                            )}
                        </div>

                        {/* <div className="d-flex gap-3">
                            <button className="btn btn-link text-dark text-decoration-none p-0 small d-flex align-items-center"><Heart size={14} className="me-1"/> Thêm vào Wishlist</button>
                            <button className="btn btn-link text-dark text-decoration-none p-0 small d-flex align-items-center"><Share2 size={14} className="me-1"/> Chia sẻ</button>
                        </div> */}

                        <div className="mt-4 pt-3 border-top">
                            <div className="accordion accordion-flush" id="productDetailsAccordion">
                                <DetailAccordionItem eventKey="desc" title={t('productDetail.descriptionTitle')} htmlContent={displayDescription} defaultOpen={true} />
                                {/* Thêm các mục accordion khác nếu có dữ liệu */}
                                {/* Ví dụ:
                                <DetailAccordionItem eventKey="specs" title={t('productDetail.specificationsTitle')} htmlContent={product.specificationsHtml} />
                                <DetailAccordionItem eventKey="shipping" title="Vận chuyển & Trả hàng" htmlContent="<p>Thông tin vận chuyển và trả hàng ở đây...</p>" />
                                */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section (Placeholder) */}
                {/* <section className="mt-5 pt-5 border-top">
                    <h2 className="h4 fw-bold mb-4 text-center">{t('productDetail.relatedProductsTitle')}</h2>
                    <div className="row g-3">
                        {[1,2,3,4].map(p => (
                            <div key={p} className="col-6 col-md-4 col-lg-3">
                                Placeholder Product Card 
                            </div>
                        ))}
                    </div>
                </section> */}
            </main>
             {/* Footer is rendered by MainLayout */}
        </div>
    );
};

export default ProductDetailPage;
