// src/components/product/ProductCard.jsx (User Frontend)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiShoppingCart } from 'react-icons/fi'; // Using FiPlus for add to cart

import { useCart } from '../../contexts/CartContext'; //
import { formatPrice } from '../../utils/formatters'; //
import { classNames } from '../../utils/helpers'; //
import OptimizedImage from '../common/OptimizedImage'; //
import LoadingSpinner from '../common/LoadingSpinner'; //
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../../utils/constants'; //

const ProductCard = ({ product, className = '' }) => {
  const { t, i18n } = useTranslation();
  const { addToCart, isLoading: cartLoading, cartError, clearCartError } = useCart(); //

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mainDisplayImage, setMainDisplayImage] = useState(PRODUCT_IMAGE_PLACEHOLDER);
  const [hoverDisplayImage, setHoverDisplayImage] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [addToCartFeedback, setAddToCartFeedback] = useState({ error: null, success: null });

  const currentLang = i18n.language;

  // Memoize available colors from inventory (unique and with stock)
  const availableColors = useMemo(() => {
    if (!product?.inventory) return [];
    const colorsMap = new Map();
    product.inventory.forEach(inv => {
      if (inv.color && inv.color.color_id && inv.quantity > 0) {
        if (!colorsMap.has(inv.color.color_id)) {
          colorsMap.set(inv.color.color_id, inv.color);
        }
      }
    });
    return Array.from(colorsMap.values());
  }, [product]);

  // Effect to set initial selected color
  useEffect(() => {
    if (availableColors.length > 0) {
      // Try to keep current selectedColor if it's still available, otherwise pick the first.
      const currentSelectedColorStillAvailable = availableColors.find(c => c.color_id === selectedColor?.color_id);
      if (currentSelectedColorStillAvailable) {
        setSelectedColor(currentSelectedColorStillAvailable);
      } else {
        setSelectedColor(availableColors[0]);
      }
    } else {
      setSelectedColor(null); // No colors with stock
    }
  }, [availableColors, product.product_id]); // Re-run if product changes or availableColors memo updates

  // Memoize available sizes based on selected color and stock
  const availableSizes = useMemo(() => {
    if (!product?.inventory || !selectedColor) {
      // If no color is selected but product has sizes (e.g. product without color variants but with size variants)
      if (!selectedColor && product?.inventory?.some(inv => inv.size && inv.quantity > 0)) {
        const sizesMap = new Map();
        product.inventory.forEach(inv => {
          if (inv.size && inv.size.size_id && inv.quantity > 0 && !inv.color) { // Only consider general inventory if no color selected
            if (!sizesMap.has(inv.size.size_id)) {
              sizesMap.set(inv.size.size_id, { ...inv.size, available: true });
            }
          }
        });
        return Array.from(sizesMap.values());
      }
      return [];
    }

    const sizesMap = new Map();
    product.inventory.forEach(inv => {
      if (inv.color?.color_id === selectedColor.color_id && inv.size && inv.size.size_id) {
        if (inv.quantity > 0) {
          if (!sizesMap.has(inv.size.size_id)) {
            sizesMap.set(inv.size.size_id, { ...inv.size, available: true });
          }
        } else {
          // Optionally include sizes that are out of stock for this color, marked as unavailable
          // if (!sizesMap.has(inv.size.size_id)) {
          //   sizesMap.set(inv.size.size_id, { ...inv.size, available: false });
          // }
        }
      }
    });
    return Array.from(sizesMap.values()).sort((a,b) => a.size_name.localeCompare(b.size_name)); // Sort sizes
  }, [product, selectedColor]);

  // Effect to set initial/update selected size
  useEffect(() => {
    if (availableSizes.length > 0) {
      const availableOnly = availableSizes.filter(s => s.available);
      if (availableOnly.length > 0) {
         const currentSelectedSizeStillAvailable = availableOnly.find(s => s.size_id === selectedSize?.size_id);
         if (currentSelectedSizeStillAvailable) {
            setSelectedSize(currentSelectedSizeStillAvailable);
         } else {
            setSelectedSize(availableOnly[0]); // Default to first available size
         }
      } else {
         setSelectedSize(null); // No sizes available for this color
      }
    } else {
      setSelectedSize(null); // No sizes offered for this color
    }
  }, [availableSizes, selectedColor, product.product_id]); // Re-run if availableSizes changes

  // Effect to update display images based on product and selectedColor
  useEffect(() => {
    if (!product || !product.images) {
      setMainDisplayImage(PRODUCT_IMAGE_PLACEHOLDER);
      setHoverDisplayImage(null);
      return;
    }

    let imagesForCurrentSelectionSource = product.images;

    if (selectedColor) {
      const colorSpecificImages = product.images.filter(img => img.color?.color_id === selectedColor.color_id);
      if (colorSpecificImages.length > 0) {
        imagesForCurrentSelectionSource = colorSpecificImages;
      } else {
        imagesForCurrentSelectionSource = product.images.filter(img => !img.color || !img.color.color_id);
      }
    } else {
      imagesForCurrentSelectionSource = product.images.filter(img => !img.color || !img.color.color_id);
    }
    
    if (imagesForCurrentSelectionSource.length === 0 && product.images.length > 0) {
        imagesForCurrentSelectionSource = product.images;
    }

    // Create a shallow copy before sorting to avoid mutating the read-only array
    const mutableImagesForSorting = [...imagesForCurrentSelectionSource]; // MODIFICATION HERE

    mutableImagesForSorting.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)); // Sort the copy

    const mainImg = mutableImagesForSorting.find(img => img.display_order === 0) || mutableImagesForSorting[0];
    const hoverImg = mutableImagesForSorting.find(img => img.display_order === 1) || (mutableImagesForSorting.length > 1 ? mutableImagesForSorting[1] : null);

    setMainDisplayImage(mainImg?.image_url ? mainImg.image_url : PRODUCT_IMAGE_PLACEHOLDER);
    setHoverDisplayImage(hoverImg?.image_url ? hoverImg.image_url : null);

  }, [product, selectedColor]);

  const handleColorClick = useCallback((e, color) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(color);
    setAddToCartFeedback({ error: null, success: null }); // Clear feedback on variant change
  }, []);

  const handleSizeClick = useCallback((e, size) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    setAddToCartFeedback({ error: null, success: null }); // Clear feedback on variant change
  }, []);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearCartError(); // Clear previous cart errors
    setAddToCartFeedback({ error: null, success: null });


    if (!product) return;

    // Validation before adding to cart
    if (availableColors.length > 0 && !selectedColor) {
      setAddToCartFeedback({ error: t('productDetail.selectColorPrompt'), success: null });
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      setAddToCartFeedback({ error: t('productDetail.selectSizePrompt'), success: null });
      return;
    }

    let inventoryItem = null;
    if (product.inventory) {
        inventoryItem = product.inventory.find(inv => {
            const colorMatch = !selectedColor || (inv.color?.color_id === selectedColor.color_id);
            const sizeMatch = !selectedSize || (inv.size?.size_id === selectedSize.size_id);
            // If product has no color/size options, match inventory items that also have no color/size
            const noVariantOptions = availableColors.length === 0 && availableSizes.length === 0;
            const generalInventoryItemMatch = noVariantOptions && !inv.color && !inv.size;

            return generalInventoryItemMatch || (colorMatch && sizeMatch);
        });
    }
    
    if (!inventoryItem || inventoryItem.quantity <= 0) {
      setAddToCartFeedback({ error: t('product.outOfStock', 'Hết hàng'), success: null });
      return;
    }

    const itemToAdd = {
      productId: product.product_id,
      quantity: 1, // Default to 1 for product card
      productVariantId: inventoryItem.inventory_id,
    };

    try {
      await addToCart(itemToAdd); //
      setAddToCartFeedback({ error: null, success: t('productDetail.addedToCartSuccess', 'Đã thêm vào giỏ!') });
      setTimeout(() => setAddToCartFeedback({ error: null, success: null }), 2000);
    } catch (err) {
      // Error is already handled by CartContext and set in cartError
      // We can display cartError directly or set a local message
      setAddToCartFeedback({ error: cartError || t('common.errorOccurred'), success: null });
    }
  }, [product, selectedColor, selectedSize, availableColors.length, availableSizes.length, addToCart, t, cartError, clearCartError]);

  if (!product || !product.product_id) return null;

  const productLink = `/product/${product.product_id}`; // Or use slug: `/product/${product.slug}` if available and preferred
  const displayProductName = product.name; // Already localized by GraphQL resolver
  const displayPrice = product.product_price;

  const currentStockForItem = useMemo(() => {
    if (!product?.inventory) return 0;
    const item = product.inventory.find(inv => 
        (!selectedColor || inv.color?.color_id === selectedColor?.color_id) &&
        (!selectedSize || inv.size?.size_id === selectedSize?.size_id) &&
        // Handle case where product has no color/size variants
        (availableColors.length > 0 || availableSizes.length > 0 || (!inv.color_id && !inv.size_id))
    );
    return item?.quantity || 0;
  }, [product, selectedColor, selectedSize, availableColors, availableSizes]);

  const isOutOfStock = currentStockForItem <= 0;

  return (
    <div
      className={classNames(
        "product-card group bg-white rounded-md shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col text-sm relative border border-transparent hover:border-gray-200",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link to={productLink} className="block relative">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 rounded-t-md">
          <OptimizedImage
            src={(isHovering && hoverDisplayImage) ? hoverDisplayImage : mainDisplayImage}
            alt={displayProductName || 'Product image'}
            containerClassName="w-full h-full"
            objectFit="object-cover"
            className="w-full h-full transition-opacity duration-300 ease-in-out"
            placeholderSrc={PRODUCT_IMAGE_PLACEHOLDER.replace(API_BASE_URL, '')} // OptimizedImage handles API_BASE_URL
          />
        </div>
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-800 hover:text-indigo-600 mb-1 text-xs md:text-sm truncate transition-colors">
          <Link to={productLink}>
            {displayProductName || t('product.untitled', 'Sản phẩm không tên')}
          </Link>
        </h3>

        {/* Color Selector */}
        {availableColors.length > 0 && (
          <div className="my-1.5 flex items-center space-x-1.5">
            {availableColors.slice(0, 7).map((color) => ( // Show max 7 colors, then '+'
              <button
                key={color.color_id}
                onClick={(e) => handleColorClick(e, color)}
                className={classNames(
                  "w-5 h-5 rounded-full border-2 focus:outline-none transition-all duration-150",
                  selectedColor?.color_id === color.color_id
                    ? 'ring-2 ring-offset-1 ring-indigo-500 border-white shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                )}
                style={{ backgroundColor: color.color_hex }}
                title={color.name} // Localized name
                aria-label={t('product.selectColor', { colorName: color.name })}
              >
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
            {availableColors.length > 7 && (
              <span className="text-xs text-gray-400">+{availableColors.length - 7}</span>
            )}
          </div>
        )}
        {selectedColor && <p className="text-[10px] text-gray-500 mb-1 truncate h-4">{t('product.color', 'Màu')}: {selectedColor.name}</p>}
         {!selectedColor && availableColors.length > 0 && <p className="text-[10px] text-gray-500 mb-1 truncate h-4">&nbsp;</p>}


        {/* Size Selector */}
        {availableSizes.length > 0 && (
          <div className="my-1.5 flex flex-wrap gap-1 items-center min-h-[26px]"> {/* Min height to prevent layout shift */}
            {availableSizes.filter(s => s.available).slice(0,4).map((size) => ( // Show max 4 available sizes
              <button
                key={size.size_id}
                onClick={(e) => handleSizeClick(e, size)}
                className={classNames(
                  'px-2 py-0.5 border rounded text-[10px] font-medium transition-colors',
                  selectedSize?.size_id === size.size_id
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-500'
                )}
                title={size.size_name}
                aria-label={t('product.selectSize', { sizeName: size.size_name })}
              >
                {size.size_name}
              </button>
            ))}
            {availableSizes.filter(s => s.available).length > 4 && <span className="text-[10px] text-gray-400 self-center">+{availableSizes.filter(s => s.available).length - 4}</span>}
          </div>
        )}
        {selectedSize && <p className="text-[10px] text-gray-500 mb-1 truncate h-4">{t('product.size', 'Kích thước')}: {selectedSize.size_name}</p>}
        {!selectedSize && availableSizes.length > 0 && <p className="text-[10px] text-gray-500 mb-1 truncate h-4">&nbsp;</p>}


        {/* Price and Add to Cart Button */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-gray-900 font-semibold text-sm md:text-base">{formatPrice(displayPrice)}</p>
          <button
            onClick={handleAddToCart}
            disabled={cartLoading || isOutOfStock}
            className={classNames(
              "p-2.5 rounded-md text-white transition-colors duration-150 flex-shrink-0",
              isOutOfStock ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-700 active:bg-gray-900"
            )}
            title={isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
            aria-label={isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
          >
            {cartLoading && (product.product_id === (addToCartFeedback?.productIdForLoading || null) ) ? <LoadingSpinner size="xs" color="text-white"/> : <FiPlus size={18} />}
          </button>
        </div>
        
        {/* Feedback Messages */}
        {addToCartFeedback.error && (
            <p className="text-xs text-red-500 mt-1 text-right h-4">{addToCartFeedback.error}</p>
        )}
        {addToCartFeedback.success && (
            <p className="text-xs text-green-600 mt-1 text-right h-4">{addToCartFeedback.success}</p>
        )}
        {/* Fallback for out of stock if no other message */}
        {isOutOfStock && !addToCartFeedback.error && !addToCartFeedback.success && (
            <p className="text-xs text-red-500 mt-1 text-right h-4">{t('product.outOfStock')}</p>
        )}
        {/* Placeholder for spacing if no message and not out of stock */}
        {!isOutOfStock && !addToCartFeedback.error && !addToCartFeedback.success && (
            <p className="text-xs mt-1 text-right h-4">&nbsp;</p>
        )}

      </div>
    </div>
  );
};

export default ProductCard;