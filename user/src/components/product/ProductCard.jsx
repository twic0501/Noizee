// user/src/components/product/ProductCard.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, ChevronDown } from 'lucide-react'; // Using lucide-react

import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/formatters';
import OptimizedImage from '../common/OptimizedImage';
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../../utils/constants';
// import logger from '../../utils/logger';

const ProductCard = ({ product, className = '' }) => {
    const { t, i18n } = useTranslation();
    const { addToCart, isLoading: cartLoadingContext, cartError, clearCartError } = useCart();
    const currentLang = i18n.language;
    const navigate = useNavigate();

    // State from your original ProductCard
    const [selectedColorId, setSelectedColorId] = useState(null);
    const [selectedSizeId, setSelectedSizeId] = useState(null);
    const [mainImage, setMainImage] = useState(PRODUCT_IMAGE_PLACEHOLDER);
    const [hoverImage, setHoverImage] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [showSizeSelector, setShowSizeSelector] = useState(false);
    const [addToCartFeedback, setAddToCartFeedback] = useState({ error: null, success: null, loading: false });
    
    const sizeSelectorRef = useRef(null);

    // Available colors derived from product inventory (your logic)
    const availableColors = useMemo(() => {
        if (!product?.inventory) return [];
        const colorsMap = new Map();
        product.inventory.forEach(inv => {
            if (inv.color && inv.color.color_id && inv.quantity > 0) {
                const colorName = inv.color.name || (currentLang === 'en' && inv.color.color_name_en ? inv.color.color_name_en : inv.color.color_name_vi) || inv.color.color_name;
                if (!colorsMap.has(inv.color.color_id)) {
                     colorsMap.set(inv.color.color_id, { ...inv.color, name: colorName });
                }
            }
        });
        return Array.from(colorsMap.values());
    }, [product, currentLang]);

    // Effect to set initial selectedColorId (your logic)
    useEffect(() => {
        if (availableColors.length > 0) {
            const defaultColorFromImage = product.images?.find(img => img.display_order === 0 && img.color)?.color;
            const initialColor = defaultColorFromImage && availableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                ? availableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                : availableColors[0];
            setSelectedColorId(initialColor.color_id);
        } else {
            setSelectedColorId(null);
        }
    }, [availableColors, product.images]);

    // Effect to update main and hover images based on selected color (your logic)
     useEffect(() => {
        if (!product?.images || product.images.length === 0) {
            setMainImage(PRODUCT_IMAGE_PLACEHOLDER.replace(API_BASE_URL, '')); // Ensure relative path
            setHoverImage(null);
            return;
        }
        let imagesForSelectedColor = product.images.filter(img => selectedColorId && img.color?.color_id === selectedColorId);
        if (imagesForSelectedColor.length === 0) imagesForSelectedColor = product.images.filter(img => !img.color);
        if (imagesForSelectedColor.length === 0) imagesForSelectedColor = product.images;
        
        const sortedImages = [...imagesForSelectedColor].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
        // DECLARE newMainImage and newHoverImage here before using them
        const imageForMainDisplay = sortedImages.find(img => img.display_order === 0) || sortedImages[0];
        const imageForHoverDisplay = sortedImages.find(img => img.display_order === 1) || (sortedImages.length > 1 ? sortedImages[1] : null);

        // Correctly use the declared variables
        setMainImage(imageForMainDisplay ? imageForMainDisplay.image_url : PRODUCT_IMAGE_PLACEHOLDER.replace(API_BASE_URL, ''));
        setHoverImage(imageForHoverDisplay ? imageForHoverDisplay.image_url : null);

    }, [product, selectedColorId, API_BASE_URL]);

    // Available sizes derived from inventory and selected color (your logic)
    const availableSizes = useMemo(() => {
        if (!product?.inventory || !selectedColorId) return [];
        const sizesMap = new Map();
        product.inventory.forEach(inv => {
            if (inv.color?.color_id === selectedColorId && inv.size && inv.quantity > 0) {
                if (!sizesMap.has(inv.size.size_id)) {
                    sizesMap.set(inv.size.size_id, inv.size);
                }
            }
        });
        return Array.from(sizesMap.values()).sort((a,b) => a.size_name.localeCompare(b.size_name));
    }, [product, selectedColorId]);

    // Effect to set initial selectedSizeId (your logic)
    useEffect(() => {
        if (availableSizes.length > 0) {
            setSelectedSizeId(availableSizes[0].size_id);
        } else {
            setSelectedSizeId(null);
        }
    }, [availableSizes]);

    // Close size selector on outside click (your logic)
    useEffect(() => {
        function handleClickOutside(event) {
            if (sizeSelectorRef.current && !sizeSelectorRef.current.contains(event.target)) {
                setShowSizeSelector(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sizeSelectorRef]);

    const handleColorChange = useCallback((colorId, e) => {
        e.stopPropagation();
        setSelectedColorId(colorId);
        setAddToCartFeedback({ error: null, success: null, loading: false });
    }, []);

    const handleSizeSelect = useCallback((sizeId, e) => {
        e.stopPropagation();
        setSelectedSizeId(sizeId);
        setShowSizeSelector(false);
        setAddToCartFeedback({ error: null, success: null, loading: false });
    }, []);

    const handleAddToCartOnCard = useCallback(async (e) => {
        e.stopPropagation();
        if (cartLoadingContext || addToCartFeedback.loading) return;

        clearCartError();
        setAddToCartFeedback({ error: null, success: null, loading: true });

        if (!product) {
            setAddToCartFeedback({ error: t('common.errorOccurred'), success: null, loading: false }); return;
        }
        if (availableColors.length > 0 && !selectedColorId) {
            setAddToCartFeedback({ error: t('productDetail.selectColorPrompt'), success: null, loading: false }); return;
        }
        if (availableSizes.length > 0 && !selectedSizeId) {
            setShowSizeSelector(true);
            setAddToCartFeedback({ error: t('productDetail.selectSizePrompt'), success: null, loading: false }); return;
        }
        const inventoryItem = product.inventory?.find(inv => inv.product_id === product.product_id && inv.color?.color_id === selectedColorId && inv.size?.size_id === selectedSizeId);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            setAddToCartFeedback({ error: t('product.outOfStock'), success: null, loading: false }); return;
        }
        const itemToAdd = { productId: product.product_id, quantity: 1, productVariantId: inventoryItem.inventory_id };
        try {
            await addToCart(itemToAdd);
            setAddToCartFeedback({ error: null, success: t('productDetail.addedToCartSuccessShort', 'Đã thêm!'), loading: false });
            setTimeout(() => setAddToCartFeedback({ error: null, success: null, loading: false }), 2000);
        } catch (err) {
            setAddToCartFeedback({ error: cartError?.message || t('common.errorOccurred'), success: null, loading: false });
        }
    }, [product, selectedColorId, selectedSizeId, addToCart, t, cartError, clearCartError, availableColors.length, availableSizes.length, cartLoadingContext, addToCartFeedback.loading]);

    const productLink = `/product/${product.product_id}`; // Using product_id for link
    const displayProductName = product.name || product.product_name_vi; // Use GQL name field if available
    const displayPrice = product.product_price;
    const currentSelectedColorObject = availableColors.find(c => c.color_id === selectedColorId);
    const currentSelectedColorName = currentSelectedColorObject?.name;

    return (
        <div className={`group relative flex flex-col h-full bg-white ${className}`}>
            <div
                className="aspect-[3/4] bg-neutral-200 overflow-hidden relative cursor-pointer"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => navigate(productLink)}
            >
                <OptimizedImage
                    // Pass mainImage and hoverImage directly, as they now store relative paths
                    src={isHovering && hoverImage ? hoverImage : mainImage}
                    alt={displayProductName || 'Product image'}
                    containerClassName="w-full"
                    aspectRatioClass="aspect-[3/4]"
                    objectFitClass="object-cover"
                />
                {product.is_new_arrival && (
                    <span className="absolute top-2 right-2 bg-black text-white text-[9px] px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                        NEW
                    </span>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3
                    className="text-xs font-medium text-black truncate cursor-pointer hover:underline mb-1"
                    title={displayProductName}
                    onClick={() => navigate(productLink)}
                >
                    {displayProductName || t('product.untitled', 'Sản phẩm không tên')}
                </h3>
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-black">{formatPrice(displayPrice)}</p>
                    {availableColors.length > 0 && (
                        <div className="flex space-x-1">
                            {availableColors.slice(0, 4).map(color => (
                                <button
                                    key={color.color_id}
                                    onClick={(e) => handleColorChange(color.color_id, e)}
                                    className={`w-4 h-4 rounded-full border-2 focus:outline-none transition-all duration-150 ${selectedColorId === color.color_id ? 'ring-1 ring-offset-1 ring-black border-black' : 'border-neutral-400 hover:border-black'}`}
                                    style={{ backgroundColor: color.color_hex }}
                                    title={color.name}
                                    aria-label={`Select color ${color.name}`}
                                />
                            ))}
                            {/* Show +N if more than 4 colors */}
                            {availableColors.length > 4 && (
                                <span className="text-[10px] text-neutral-500 self-center">+{availableColors.length - 4}</span>
                            )}
                        </div>
                    )}
                </div>

                 {currentSelectedColorName && (
                     <p className="text-[11px] text-neutral-600 mb-2 truncate h-4">
                        {t('product.color', 'Màu')}: {currentSelectedColorName}
                    </p>
                )}
                {!currentSelectedColorName && availableColors.length > 0 && (
                    <p className="text-[11px] h-4 mb-2"> </p> // Placeholder for height consistency
                )}


                <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-200">
                    <div className="relative flex-grow mr-2" ref={sizeSelectorRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSizeSelector(!showSizeSelector); }}
                            className="w-full text-left text-[11px] text-neutral-700 border border-neutral-300 rounded px-2 py-1 hover:border-black flex justify-between items-center"
                        >
                            <span className="truncate">
                                {availableSizes.find(s => s.size_id === selectedSizeId)?.size_name || t('product.selectSizeShort', 'Size')}
                            </span>
                            <ChevronDown size={12} className={`transition-transform ${showSizeSelector ? 'rotate-180' : ''}`} />
                        </button>
                        {showSizeSelector && (
                            <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-neutral-300 rounded shadow-lg z-20 max-h-28 overflow-y-auto">
                                {availableSizes.map(size => (
                                    <button
                                        key={size.size_id}
                                        onClick={(e) => handleSizeSelect(size.size_id, e)}
                                        className={`block w-full text-left px-2 py-1 text-[11px] hover:bg-neutral-100 ${selectedSizeId === size.size_id ? 'bg-neutral-200 font-semibold' : ''}`}
                                    >
                                        {size.size_name}
                                    </button>
                                ))}
                                {availableSizes.length === 0 && (
                                    <span className="block px-2 py-1 text-[11px] text-neutral-500">
                                        {t('product.noSizesForColor', 'Chọn màu')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCartOnCard}
                        disabled={cartLoadingContext || addToCartFeedback.loading || (availableSizes.length > 0 && !selectedSizeId)}
                        className="p-1.5 bg-black text-white rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:opacity-50"
                        aria-label={t('product.addToCart', 'Thêm vào giỏ hàng')}
                    >
                        {addToCartFeedback.loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <ShoppingCart size={16} />
                        )}
                    </button>
                </div>
                {/* Feedback message area */}
                <div className="h-3 mt-1 text-right"> {/* Fixed height to prevent layout shifts */}
                    {(addToCartFeedback.error || addToCartFeedback.success) && (
                        <p className={`text-[10px] ${addToCartFeedback.error ? 'text-red-600' : 'text-green-600'}`}>
                            {addToCartFeedback.error || addToCartFeedback.success}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;