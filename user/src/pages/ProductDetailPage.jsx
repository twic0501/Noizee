// user/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
    ShoppingCart, Minus, Plus, CheckCircle, ChevronDown, ChevronUp, ArrowLeft,
    Maximize, Heart, Share2
} from 'lucide-react';
import DOMPurify from 'dompurify';

import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/productQueries';
import { useCart } from '../contexts/CartContext';
// Assuming LoadingSpinner and AlertMessage are Tailwind-styled
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
// ImageCarousel might need its own refactoring if it's not just OptimizedImage
// For simplicity, the target design uses simple main image + thumbnails, so we'll build that here
import OptimizedImage from '../components/common/OptimizedImage';
import { formatPrice } from '../utils/formatters';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/constants';
// import logger from '../utils/logger';

// DetailAccordionItem (Tailwind styled)
const DetailAccordionItem = ({ title, htmlContent, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    if (!htmlContent) return null;
    const cleanContent = DOMPurify.sanitize(htmlContent);

    return (
        <div className="border-b border-neutral-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-4 text-left text-sm font-medium text-black focus:outline-none"
            >
                <span>{title}</span>
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
            {isOpen && (
                <div className="pb-4 text-xs text-neutral-700 leading-relaxed prose prose-sm max-w-none"
                     dangerouslySetInnerHTML={{ __html: cleanContent }} />
            )}
        </div>
    );
};


const ProductDetailPage = () => {
    const { t, i18n } = useTranslation();
    const { productSlug } = useParams(); // Assuming slug is product_id from your GQL
    const navigate = useNavigate();
    const { addToCart, isLoading: cartLoadingContext, cartError, clearCartError } = useCart();
    const currentLang = i18n.language;

    const [selectedColorId, setSelectedColorId] = useState(null);
    const [selectedSizeId, setSelectedSizeId] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addToCartFeedback, setAddToCartFeedback] = useState({ error: null, success: null, loading: false });

    const [activeMainImage, setActiveMainImage] = useState(PRODUCT_IMAGE_PLACEHOLDER);
    const [galleryThumbnails, setGalleryThumbnails] = useState([]);


    const { data, loading: queryLoading, error: queryError } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
        variables: { id: productSlug, lang: currentLang }, // Use 'id' if your GQL query expects 'id'
        fetchPolicy: 'cache-and-network',
        onCompleted: (queryData) => {
            if (queryData?.product) {
                const product = queryData.product;
                const initialAvailableColors = product.inventory
                    ?.filter(inv => inv.color && inv.color.color_id && inv.quantity > 0)
                    .map(inv => inv.color)
                    .filter((color, index, self) => index === self.findIndex(c => c.color_id === color.color_id)) || [];

                let initialColorIdToSet = null;
                if (initialAvailableColors.length > 0) {
                    const defaultColorFromImage = product.images?.find(img => img.display_order === 0 && img.color)?.color;
                    const initialColor = defaultColorFromImage && initialAvailableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                        ? initialAvailableColors.find(ac => ac.color_id === defaultColorFromImage.color_id)
                        : initialAvailableColors[0];
                    initialColorIdToSet = initialColor.color_id;
                }
                setSelectedColorId(initialColorIdToSet); // This will trigger the image update useEffect
            }
        }
    });

    const product = data?.product;

    // Memoized selectors for colors and sizes
    const availableColors = useMemo(() => {
        if (!product?.inventory) return [];
        const colorsMap = new Map();
        product.inventory.forEach(inv => {
            if (inv.color && inv.color.color_id && inv.quantity > 0) {
                 if (!colorsMap.has(inv.color.color_id)) {
                    const colorName = inv.color.name || (currentLang === 'en' && inv.color.color_name_en ? inv.color.color_name_en : inv.color.color_name_vi) || inv.color.color_name; // Get translated name
                    colorsMap.set(inv.color.color_id, { ...inv.color, name: colorName });
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
                sizesMap.set(inv.size.size_id, { ...inv.size, available: inv.quantity > 0 });
            }
        });
        return Array.from(sizesMap.values()).sort((a,b) => a.size_name.localeCompare(b.size_name));
    }, [product, selectedColorId]);

    // Update selected size when color changes or availableSizes change
    useEffect(() => {
        if (availableSizes.length > 0) {
            const firstAvailableSize = availableSizes.find(s => s.available);
            setSelectedSizeId(firstAvailableSize ? firstAvailableSize.size_id : null);
        } else {
            setSelectedSizeId(null);
        }
        setQuantity(1); // Reset quantity on variant change
        setAddToCartFeedback({ error: null, success: null, loading: false });
    }, [selectedColorId, availableSizes]);


    // Update active images based on product and selected color
    useEffect(() => {
        if (!product || !product.images) {
            setActiveMainImage(PRODUCT_IMAGE_PLACEHOLDER.replace(API_BASE_URL, ''));
            setGalleryThumbnails([]);
            return;
        }
        let imagesToDisplay = product.images.filter(img => selectedColorId && img.color?.color_id === selectedColorId);
        if (imagesToDisplay.length === 0) imagesToDisplay = product.images.filter(img => !img.color); // Fallback to general images
        if (imagesToDisplay.length === 0) imagesToDisplay = product.images; // Fallback to all images

        const sortedImages = [...imagesToDisplay].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        if (sortedImages.length > 0) {
            setActiveMainImage(sortedImages[0].image_url); // Store relative path
            setGalleryThumbnails(sortedImages.map(img => ({
                src: img.image_url, // Store relative path
                alt: img.alt_text || product.name || `Thumbnail ${img.image_id}`
            })));
        } else {
            setActiveMainImage(PRODUCT_IMAGE_PLACEHOLDER.replace(API_BASE_URL, ''));
            setGalleryThumbnails([]);
        }
    }, [product, selectedColorId, currentLang]);


    const handleColorSelect = useCallback((color) => {
        setSelectedColorId(color.color_id);
    }, []);

    const handleSizeSelect = useCallback((size) => {
        setSelectedSizeId(size.size_id);
    }, []);

    const currentInventoryItem = useMemo(() => {
        if (!product?.inventory || !selectedColorId || (availableSizes.length > 0 && !selectedSizeId)) return null;
        return product.inventory.find(inv =>
            inv.color?.color_id === selectedColorId &&
            (availableSizes.length === 0 || inv.size?.size_id === selectedSizeId)
        );
    }, [product, selectedColorId, selectedSizeId, availableSizes]);

    const stockForSelection = currentInventoryItem?.quantity || 0;
    const isSelectionOutOfStock = stockForSelection <= 0 && (selectedColorId && (availableSizes.length === 0 || selectedSizeId));


    const handleQuantityChange = (amount) => {
        setQuantity((prev) => {
            const newQuantity = prev + amount;
            if (newQuantity >= 1 && newQuantity <= stockForSelection) return newQuantity;
            if (newQuantity < 1) return 1;
            if (newQuantity > stockForSelection && stockForSelection > 0) return stockForSelection;
            if (stockForSelection === 0 && quantity !== 1) return 1; // If out of stock, allow quantity 1 for display
            return prev;
        });
    };

     const handleAddToCartClick = useCallback(async () => {
        if (cartLoadingContext) return;
        clearCartError();
        setAddToCartFeedback({ error: null, success: null, loading: true });

        if (!product) { setAddToCartFeedback({ error: t('common.errorOccurred'), success: null, loading: false }); return; }
        if (availableColors.length > 0 && !selectedColorId) { setAddToCartFeedback({ error: t('productDetail.selectColorPrompt'), success: null, loading: false }); return; }
        if (availableSizes.length > 0 && !selectedSizeId) { setAddToCartFeedback({ error: t('productDetail.selectSizePrompt'), success: null, loading: false }); return; }
        if (!currentInventoryItem || stockForSelection <= 0) { setAddToCartFeedback({ error: t('product.outOfStock'), success: null, loading: false }); return; }
        if (quantity <= 0) { setAddToCartFeedback({ error: t('productDetail.quantityMustBePositive'), success: null, loading: false }); return; }
        if (quantity > stockForSelection) { setAddToCartFeedback({ error: t('productDetail.notEnoughStock'), success: null, loading: false }); return; }

        const itemToAdd = { productId: product.product_id, quantity: quantity, productVariantId: currentInventoryItem.inventory_id };
        try {
            await addToCart(itemToAdd);
            setAddToCartFeedback({ error: null, success: t('productDetail.addedToCartSuccess'), loading: false });
            setTimeout(() => setAddToCartFeedback({ error: null, success: null, loading: false }), 3000);
        } catch (err) {
            setAddToCartFeedback({ error: cartError?.message || t('common.errorOccurred'), success: null, loading: false });
        }
    }, [product, selectedColorId, selectedSizeId, quantity, addToCart, t, cartError, clearCartError, availableColors.length, availableSizes.length, currentInventoryItem, stockForSelection, cartLoadingContext]);


    if (queryLoading && !data) return <div className="container mx-auto py-10 text-center"><div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
    if (queryError) return <div className="container mx-auto my-4"><AlertMessage type="error" title={t('productDetail.errorLoadingTitle')} message={queryError.message} /></div>;
    if (!product) return <div className="container mx-auto my-4"><AlertMessage type="info" message={t('productDetail.notFound')} /></div>;

    const displayProductName = product.name; // GQL field 'name' is already localized by resolver
    const displayDescription = product.description; // GQL field 'description' is localized

    return (
        <div className="min-h-screen bg-white text-black">
            {/* Header is part of MainLayout */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate(-1)} className="text-sm text-black hover:underline flex items-center mb-6">
                    <ArrowLeft size={18} className="mr-1" /> {t('productDetail.backToListing', 'Back to products')}
                </button>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Image Gallery Column */}
                    <div className="w-full lg:w-3/5 flex flex-col-reverse lg:flex-row gap-4">
                        {/* Thumbnails (Vertical on lg+) */}
                        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[500px] pr-2 pb-2 lg:pb-0 lg:pr-0 scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-neutral-200">
                            {galleryThumbnails.map((thumb, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveMainImage(thumb.src)}
                                    className={`w-20 h-24 flex-shrink-0 border rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-black
                                                ${activeMainImage === thumb.src ? 'ring-2 ring-black border-black' : 'border-neutral-300'}`}
                                >
                                    <OptimizedImage src={thumb.src} alt={thumb.alt} containerClassName="w-full h-full" objectFitClass="object-cover" />
                                </button>
                            ))}
                        </div>
                        {/* Main Image */}
                        <div className="flex-1 aspect-[4/5] bg-neutral-100 border border-neutral-300 rounded-md overflow-hidden relative">
                            <OptimizedImage src={activeMainImage} alt={displayProductName} containerClassName="w-full h-full" objectFitClass="object-cover" />
                            {/* <button className="absolute top-3 right-3 p-2 bg-white/70 rounded-full text-black hover:bg-white"><Maximize size={20}/></button> */}
                        </div>
                    </div>

                    {/* Product Info Column */}
                    <div className="w-full lg:w-2/5">
                        <p className="text-xs uppercase text-neutral-500 mb-1">
                            {product.category?.name || t('product.uncategorized', 'Uncategorized')}
                        </p>
                        <h1 className="text-2xl lg:text-3xl font-semibold text-black mb-2">{displayProductName}</h1>
                        {product.is_new_arrival && (
                             <span className="text-[10px] bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wider rounded-sm mb-2 inline-block mr-2">NEW</span>
                        )}
                        {isSelectionOutOfStock && (
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 font-semibold uppercase tracking-wider rounded-sm mb-2 inline-block">{t('product.outOfStock')}</span>
                        )}
                        <p className="text-xl lg:text-2xl font-medium text-black mb-4">{formatPrice(product.product_price)}</p>

                        {/* Color Selector */}
                        {availableColors.length > 0 && (
                            <div className="mb-5">
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    {t('product.color', 'MÀU SẮC')}: <span className="text-black">{availableColors.find(c => c.color_id === selectedColorId)?.name}</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color.color_id}
                                            onClick={() => handleColorSelect(color)}
                                            className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all duration-150
                                                        ${selectedColorId === color.color_id ? 'ring-2 ring-offset-1 ring-black border-black' : 'border-neutral-300 hover:border-neutral-500'}`}
                                            style={{ backgroundColor: color.color_hex }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selector */}
                        {availableSizes.length > 0 && (
                             <div className="mb-5">
                                <div className="flex justify-between items-center mb-1.5">
                                     <label className="block text-xs font-medium text-neutral-700">
                                        {t('product.size', 'KÍCH THƯỚC')}: <span className="text-black">{availableSizes.find(s => s.size_id === selectedSizeId)?.size_name}</span>
                                    </label>
                                    {/* <a href="#" className="text-xs text-black hover:underline">Size Guide</a> */}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size.size_id}
                                            onClick={() => handleSizeSelect(size)}
                                            disabled={!size.available}
                                            className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors
                                                        ${selectedSizeId === size.size_id ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300 hover:border-black'}
                                                        ${!size.available ? 'opacity-50 cursor-not-allowed bg-neutral-100 line-through' : ''}`}
                                        >
                                            {size.size_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isSelectionOutOfStock && !queryLoading && (
                             <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-sm mb-3 inline-block">{t('productDetail.outOfStock')}</span>
                        )}


                        {/* Quantity Selector */}
                        <div className="mb-6">
                            <label htmlFor="quantity" className="block text-xs font-medium text-neutral-700 mb-1.5">{t('productDetail.quantity', 'SỐ LƯỢNG')}</label>
                            <div className="flex items-center border border-neutral-400 rounded w-max">
                                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isSelectionOutOfStock} className="px-3 py-2 text-black disabled:opacity-50 focus:outline-none">
                                    <Minus size={16}/>
                                </button>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) {
                                            if (val >=1 && val <= stockForSelection) setQuantity(val);
                                            else if (val < 1) setQuantity(1);
                                            else if (val > stockForSelection && stockForSelection > 0) setQuantity(stockForSelection);
                                        }
                                    }}
                                    readOnly={isSelectionOutOfStock && stockForSelection === 0}
                                    className="w-12 text-center text-sm text-black border-x border-neutral-400 focus:outline-none py-2 bg-transparent"
                                />
                                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= stockForSelection || isSelectionOutOfStock} className="px-3 py-2 text-black disabled:opacity-50 focus:outline-none">
                                    <Plus size={16}/>
                                </button>
                            </div>
                             {stockForSelection > 0 && stockForSelection < 10 && !isSelectionOutOfStock && (
                                <p className="text-red-600 text-xs mt-1">{t('productDetail.lowStock', 'Chỉ còn {{count}} sản phẩm!', { count: stockForSelection })}</p>
                            )}
                        </div>

                        {/* Add to Cart / Buy Now Buttons */}
                        <div className="space-y-3 mb-6">
                             <button
                                onClick={handleAddToCartClick}
                                disabled={cartLoadingContext || addToCartFeedback.loading || isSelectionOutOfStock || (availableSizes.length > 0 && !selectedSizeId) || quantity <=0}
                                className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-neutral-800 transition-colors text-sm uppercase disabled:opacity-60 flex items-center justify-center"
                            >
                                {addToCartFeedback.loading || cartLoadingContext ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <ShoppingCart size={18} className="mr-2"/>
                                )}
                                {isSelectionOutOfStock ? t('product.outOfStock') : t('productDetail.addToCartButton')}
                            </button>
                            {/* <button className="w-full bg-neutral-700 text-white py-3 rounded-md font-semibold hover:bg-neutral-600 transition-colors text-sm uppercase">Buy with Express Pay</button> */}
                        </div>
                        {/* Feedback Message */}
                        <div className="h-5 mb-4"> {/* Fixed height for feedback area */}
                            {addToCartFeedback.success && (
                                <div className="text-xs text-green-600 flex items-center">
                                    <CheckCircle size={14} className="mr-1"/>{addToCartFeedback.success}
                                </div>
                            )}
                            {addToCartFeedback.error && (
                                <div className="text-xs text-red-600">
                                    {addToCartFeedback.error}
                                </div>
                            )}
                        </div>

                        {/* Meta Actions */}
                        {/* <div className="flex space-x-3">
                            <button className="flex items-center text-xs text-black hover:underline"><Heart size={14} className="mr-1"/> Add to Wishlist</button>
                            <button className="flex items-center text-xs text-black hover:underline"><Share2 size={14} className="mr-1"/> Share</button>
                        </div> */}

                        {/* Accordion for Details */}
                        <div className="mt-8 pt-6 border-t border-neutral-200">
                            <DetailAccordionItem eventKey="0" title={t('productDetail.descriptionTitle')} htmlContent={displayDescription} defaultOpen={true} />
                            {/* Add more accordion items for details, composition, care if available */}
                            {/* <DetailAccordionItem eventKey="1" title="Product Details" htmlContent="<ul><li>Detail 1</li><li>Detail 2</li></ul>" /> */}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetailPage;