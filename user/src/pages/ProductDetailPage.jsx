// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiMinus, FiPlus, FiCheckCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

import { GET_PRODUCT_DETAILS_QUERY } from '../api/graphql/productQueries';
import { useCart } from '../contexts/CartContext';
// import { useAuth } from '../../contexts/AuthContext'; // If wishlist or other auth features needed
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import ImageCarousel from '../components/product/ImageCarousel';
import ColorSelector from '../components/product/ColorSelector';
import SizeSelector from '../components/product/SizeSelector';
import { formatPrice } from '../utils/formatters';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/constants';
import useToggle from '../hooks/useToggle'; // For accordion-like details

const DetailAccordionItem = ({ title, content, defaultOpen = false }) => {
    const [isOpen, toggleOpen] = useToggle(defaultOpen);
    if (!content) return null;
    return (
        <div className="border-b border-gray-200 py-5">
            <button
                onClick={toggleOpen}
                className="flex justify-between items-center w-full text-left text-gray-700 hover:text-gray-900"
            >
                <span className="font-medium">{title}</span>
                {isOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
            </button>
            {isOpen && (
                <div className="mt-3 text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            )}
        </div>
    );
};


const ProductDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { productSlug } = useParams(); // Assuming productSlug is used, adjust if it's product_id
  const { addToCart, isLoading: cartLoading } = useCart();
  const currentLang = i18n.language;

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [activeGalleryImages, setActiveGalleryImages] = useState([]);

  const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
    variables: { id: productSlug, lang: currentLang }, // Query uses 'id', ensure productSlug is the ID or change query var name
    fetchPolicy: 'cache-and-network',
  });
  const product = data?.product;

  const availableColors = useMemo(() => {
    if (!product?.inventory) return [];
    const colorsMap = new Map();
    product.inventory.forEach(inv => {
      if (inv.color && inv.color.color_id && !colorsMap.has(inv.color.color_id)) {
        colorsMap.set(inv.color.color_id, inv.color);
      }
    });
    return Array.from(colorsMap.values());
  }, [product]);

  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    } else if (availableColors.length === 0 && selectedColor) {
        setSelectedColor(null);
    }
  }, [availableColors, selectedColor]);

  const availableSizesForSelectedColor = useMemo(() => {
    if (!product?.inventory) return [];
    const sizesMap = new Map();
    let inventoryToCheck = product.inventory;
    if (selectedColor) {
        inventoryToCheck = product.inventory.filter(inv => inv.color?.color_id === selectedColor.color_id);
    } else {
        inventoryToCheck = product.inventory.filter(inv => !inv.color_id); // Sizes for products with no color variants
    }
    inventoryToCheck.forEach(inv => {
      if (inv.size && inv.size.size_id && inv.quantity > 0) {
        if (!sizesMap.has(inv.size.size_id)) {
          sizesMap.set(inv.size.size_id, { ...inv.size, available: true }); // Mark as available
        }
      }
    });
    // Also add sizes that might exist but have 0 quantity for this color, marking them as unavailable
     if (selectedColor) { // Only do this if a color is selected
        product.inventory.forEach(inv => {
            if (inv.color?.color_id === selectedColor.color_id && inv.size && inv.size.size_id && inv.quantity <= 0) {
                if (!sizesMap.has(inv.size.size_id)) { // Add if not already added as available
                    sizesMap.set(inv.size.size_id, { ...inv.size, available: false });
                }
            }
        });
    }

    return Array.from(sizesMap.values());
  }, [product, selectedColor]);

  useEffect(() => {
    const targetSizes = availableSizesForSelectedColor.filter(s => s.available); // Only consider available sizes for default
    if (targetSizes.length > 0) {
      const currentSizeStillAvailable = targetSizes.find(s => s.size_id === selectedSize?.size_id);
      if (!currentSizeStillAvailable) {
        setSelectedSize(targetSizes[0]);
      } else {
         setSelectedSize(currentSizeStillAvailable);
      }
    } else {
      setSelectedSize(null);
    }
  }, [selectedColor, availableSizesForSelectedColor, selectedSize]); // product removed

  useEffect(() => {
    if (!product || !product.images) {
      setActiveGalleryImages([]); return;
    }
    let imagesToDisplay = [];
    const generalImages = product.images.filter(img => !img.color || !img.color.color_id);

    if (selectedColor) {
      imagesToDisplay = product.images.filter(img => img.color?.color_id === selectedColor.color_id);
    }
    
    // Smartly combine: if color selected and has specific images, use them. Then append general if not already present.
    // If no color selected, or selected color has no images, use general images.
    let finalImageSet = [];
    if (selectedColor && imagesToDisplay.length > 0) {
        finalImageSet = [...imagesToDisplay];
        // Add general images that are not already part of the color-specific set (by image_url perhaps, or rely on display_order)
        // This logic might need refinement based on how you want to merge.
        // For now, let's assume variant images take precedence.
    } else {
        finalImageSet = [...generalImages];
    }
     if (finalImageSet.length === 0 && product.images.length > 0) { // Ultimate fallback
        finalImageSet = product.images;
    }


    setActiveGalleryImages(
      finalImageSet
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(img => ({
          original: `${API_BASE_URL}${img.image_url}`,
          thumbnail: `${API_BASE_URL}${img.image_url}`,
          originalAlt: img.alt_text || product.name,
          id: img.image_id,
      }))
    );
  }, [product, selectedColor, currentLang, API_BASE_URL]);

  const handleColorSelect = (color) => { setSelectedColor(color); setQuantity(1); setAddToCartSuccess(false); };
  const handleSizeSelect = (size) => { setSelectedSize(size); setQuantity(1); setAddToCartSuccess(false);};

  let currentInventoryItem = null;
  if (product?.inventory) {
      if (selectedColor && selectedSize) {
          currentInventoryItem = product.inventory.find(inv => inv.color?.color_id === selectedColor.color_id && inv.size?.size_id === selectedSize.size_id);
      } else if (selectedColor && availableSizesForSelectedColor.length === 0) {
           currentInventoryItem = product.inventory.find(inv => inv.color?.color_id === selectedColor.color_id && !inv.size_id);
      } else if (!selectedColor && selectedSize) {
          currentInventoryItem = product.inventory.find(inv => !inv.color_id && inv.size?.size_id === selectedSize.size_id);
      } else if (!selectedColor && !selectedSize && product.inventory?.length === 1 && !product.inventory[0].color_id && !product.inventory[0].size_id) {
          currentInventoryItem = product.inventory[0];
      } else if (!selectedColor && !selectedSize && product.inventory?.length > 0 && !availableColors.length && availableSizesForSelectedColor.length === 0) {
          currentInventoryItem = product.inventory.find(inv => inv.quantity > 0);
      }
  }
  const stockForSelection = currentInventoryItem?.quantity || 0;

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => {
      const newQuantity = prev + amount;
      if (newQuantity >= 1 && newQuantity <= stockForSelection) return newQuantity;
      if (newQuantity < 1) return 1;
      if (newQuantity > stockForSelection) return stockForSelection; // Cap at stock
      return prev;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const requiresVariantSelection = availableColors.length > 0 || availableSizesForSelectedColor.length > 0;

    if (availableColors.length > 0 && !selectedColor) {
      alert(t('productDetail.selectColorPrompt')); return;
    }
    if (availableSizesForSelectedColor.length > 0 && !selectedSize) {
      alert(t('productDetail.selectSizePrompt')); return;
    }
    if (requiresVariantSelection && !currentInventoryItem) {
        alert(t('product.variantNotAvailable', 'Sản phẩm với lựa chọn này hiện không có sẵn.')); return;
    }
    if (stockForSelection <= 0) {
        alert(t('product.outOfStock', 'Sản phẩm này đã hết hàng.')); return;
    }

    setAddToCartSuccess(false);
    const itemToAdd = {
      productId: product.product_id,
      quantity: quantity,
      productVariantId: currentInventoryItem ? currentInventoryItem.inventory_id : null,
    };
    try {
      await addToCart(itemToAdd);
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 3000);
    } catch (err) { /* console.error */ }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="xl" /></div>;
  if (error) return <div className="container mx-auto px-4 py-8"><AlertMessage type="error" title={t('productDetail.errorLoadingTitle')} message={error.message} /></div>;
  if (!product) return <div className="container mx-auto px-4 py-8"><AlertMessage type="info" message={t('productDetail.notFound')} /></div>;

  const isSelectionOutOfStock = stockForSelection <= 0;


  return (
    <div className="bg-white"> {/* Changed background to white for product page */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Optional Breadcrumbs */}
        {/* <Breadcrumbs items={[...]} className="mb-6"/> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 lg:gap-x-12">
          {/* Left: Image Carousel */}
          <div className="product-gallery-container lg:sticky lg:top-24 self-start"> {/* Sticky for desktop */}
            <ImageCarousel images={activeGalleryImages} productName={product.name} />
          </div>

          {/* Right: Product Details & Actions */}
          <div className="product-info-container mt-8 lg:mt-0">
            {/* <p className="text-sm text-gray-500 mb-1">{product.category?.name || 'Uncategorized'}</p> */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
            {/* SKU/Brand can go here if needed */}
            <p className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-5">{formatPrice(product.product_price)}</p>

            {availableColors.length > 0 && (
              <ColorSelector
                colors={availableColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                className="mb-5"
              />
            )}

            {availableSizesForSelectedColor.length > 0 && (
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                    <h4 className="text-sm font-medium text-gray-800">
                        {t('product.size', 'Kích thước')}:
                        <span className="ml-1 font-normal text-gray-600">{selectedSize?.size_name || ''}</span>
                    </h4>
                    {/* <a href="#" className="text-xs text-indigo-600 hover:underline">{t('product.sizeGuide', 'Size Guide')}</a> */}
                </div>
                <SizeSelector
                  sizes={availableSizesForSelectedColor} // Pass available prop within each size object
                  selectedSize={selectedSize}
                  onSizeSelect={handleSizeSelect}
                />
              </div>
            )}

            <div className="flex items-center gap-x-4 mb-6">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700 sr-only">{t('productDetail.quantity')}:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="p-2.5 text-gray-600 hover:text-gray-800 disabled:opacity-50"><FiMinus size={16}/></button>
                <input type="text" readOnly value={quantity} className="w-10 text-center border-x border-gray-300 text-sm py-2 focus:outline-none" />
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= stockForSelection || isSelectionOutOfStock} className="p-2.5 text-gray-600 hover:text-gray-800 disabled:opacity-50"><FiPlus size={16}/></button>
              </div>
            
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || isSelectionOutOfStock}
                className={`flex-1 py-3 px-6 rounded-md font-semibold text-white transition-colors flex items-center justify-center text-base
                            ${isSelectionOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-700'}`}
              >
                {cartLoading ? <LoadingSpinner size="sm" /> : (isSelectionOutOfStock ? t('productDetail.outOfStock') : t('productDetail.addToCartButton'))}
              </button>
            </div>

            {addToCartSuccess && (
                <div className="mt-3 mb-3 flex items-center text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    <FiCheckCircle className="w-5 h-5 mr-2"/>
                    {t('productDetail.addedToCartSuccess', 'Đã thêm vào giỏ hàng thành công!')}
                </div>
            )}
            
            <div className="mt-8 pt-5 border-t border-gray-200">
                <DetailAccordionItem title={t('productDetail.descriptionTitle')} content={product.description} defaultOpen={true} />
                {/* Add more AccordionItems for specs, shipping, etc. */}
                {/* <DetailAccordionItem title="Thông số kỹ thuật" content={"<p>Chất liệu: Cotton 100%</p><p>Xuất xứ: Việt Nam</p>"} /> */}
            </div>
          </div>
        </div>
        {/* Related Products, Reviews etc. can go below this grid */}
      </div>
    </div>
  );
};

export default ProductDetailPage;
